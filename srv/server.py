import json
import os
import sys

import bottle
import pandas as pd
import snowflake.connector

bottle.debug(True)
app = bottle.Bottle()


QUERY = """
SELECT
    VALUE:access_device_location_city AS CITY,
    VALUE:access_device_location_state_code AS STATE,
    VALUE:access_device_location_country_code AS COUNTRY,
    VALUE:access_device_location_coordinates_latitude AS LATITUDE,
    VALUE:access_device_location_coordinates_longitude AS LONGITUDE,
    VALUE:ts AS TS,
    VALUE:user_key AS UKEY,
    VALUE:result AS RESULT
FROM "SEEDLING_DB"."LOG"."AUTHLOG"
WHERE
    VALUE:access_device_location_city IS NOT NULL AND
    AKEY = '{akey}' AND
    VALUE:ts > '{start}' AND
    VALUE:ts < '{end}'
"""

conn = snowflake.connector.connect(
    user=os.environ['SEEDLING_USERNAME'],
    account='duoeng',
    database='seedling_db',
    schema='main',
    role='rd_user',
    warehouse='RD_WH',
    authenticator='externalbrowser'
)


def get_data_path():
    from pathlib import Path
    return (
        Path(__file__).resolve().parent.parent / 'data' / 'processed'
        / 'DA09CJX4KW6RZ376NFHJ_2020-12-15_2021-01-01_count_by_city.json'
    )


def get_counts(df):
    out_df = df.groupby(['CITY', 'STATE', 'COUNTRY']).agg(
        avg_latitude=pd.NamedAgg(column='LATITUDE', aggfunc="mean"),
        avg_longitude=pd.NamedAgg(column='LONGITUDE', aggfunc="mean"),
        auths=pd.NamedAgg(column='TS', aggfunc='count')
    )

    records = []
    for index, row in out_df.iterrows():
        records.append(
            dict(
                city=index[0],
                state=index[1],
                country=index[2],
                coordinates=(row.avg_longitude, row.avg_latitude),
                auths=int(row.auths)
            )
        )

    return json.dumps(records)


@app.get('/counts/<akey>')
def counts(akey):
    start = bottle.request.query.get('start', '1970-01-01')
    end = bottle.request.query.get('end', '2022-01-01')

    cur = conn.cursor()
    cur.execute(QUERY.format(akey=akey, start=start, end=end))
    df = cur.fetch_pandas_all()

    print(len(df))

    df.LATITUDE = pd.to_numeric(df.LATITUDE)
    df.LONGITUDE = pd.to_numeric(df.LONGITUDE)

    for col in ['CITY', 'STATE', 'COUNTRY']:
        df[col] = df[col].str.replace('"', '')

    data = get_counts(df)

    bottle.response.content_type = 'application/json'
    return data


bottle.run(app, host='localhost', port=sys.argv[1])
