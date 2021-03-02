#!/usr/bin/env python
import snowflake.connector

# Gets the version
ctx = snowflake.connector.connect(
    user='SMIEL@DUOSECURITY.COM',
    account='duoeng',
    database='seedling_db',
    schema='main',
    role='rd_user',
    warehouse='RD_WH',
    authenticator='externalbrowser'
)
cs = ctx.cursor()
try:
    cs.execute("SELECT current_version()")
    one_row = cs.fetchone()
    print(one_row[0])
finally:
    cs.close()
ctx.close()
