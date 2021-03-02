
import React, { useState, useEffect } from "react"
import { geoEqualEarth, geoPath } from "d3-geo"
import { feature } from "topojson-client"
import { scaleSqrt } from "d3-scale"
import styles from "./WorldMap.module.css"

// const cities = [
//   { name: "Tokyo",          coordinates: [139.6917,35.6895],  auths: 37843000 },
//   { name: "Jakarta",        coordinates: [106.8650,-6.1751],  auths: 30539000 },
//   { name: "Delhi",          coordinates: [77.1025,28.7041],   auths: 24998000 },
//   { name: "Manila",         coordinates: [120.9842,14.5995],  auths: 24123000 },
//   { name: "Seoul",          coordinates: [126.9780,37.5665],  auths: 23480000 },
//   { name: "Shanghai",       coordinates: [121.4737,31.2304],  auths: 23416000 },
//   { name: "Karachi",        coordinates: [67.0099,24.8615],   auths: 22123000 },
//   { name: "Beijing",        coordinates: [116.4074,39.9042],  auths: 21009000 },
//   { name: "New York",       coordinates: [-74.0059,40.7128],  auths: 20630000 },
//   { name: "Guangzhou",      coordinates: [113.2644,23.1291],  auths: 20597000 },
//   { name: "Sao Paulo",      coordinates: [-46.6333,-23.5505], auths: 20365000 },
//   { name: "Mexico City",    coordinates: [-99.1332,19.4326],  auths: 20063000 },
//   { name: "Mumbai",         coordinates: [72.8777,19.0760],   auths: 17712000 },
//   { name: "Osaka",          coordinates: [135.5022,34.6937],  auths: 17444000 },
//   { name: "Moscow",         coordinates: [37.6173,55.7558],   auths: 16170000 },
//   { name: "Dhaka",          coordinates: [90.4125,23.8103],   auths: 15669000 },
//   { name: "Greater Cairo",  coordinates: [31.2357,30.0444],   auths: 15600000 },
//   { name: "Los Angeles",    coordinates: [-118.2437,34.0522], auths: 15058000 },
//   { name: "Bangkok",        coordinates: [100.5018,13.7563],  auths: 14998000 },
//   { name: "Kolkata",        coordinates: [88.3639,22.5726],   auths: 14667000 },
//   { name: "Buenos Aires",   coordinates: [-58.3816,-34.6037], auths: 14122000 },
//   { name: "Tehran",         coordinates: [51.3890,35.6892],   auths: 13532000 },
//   { name: "Istanbul",       coordinates: [28.9784,41.0082],   auths: 13287000 },
//   { name: "Lagos",          coordinates: [3.3792,6.5244],     auths: 13123000 },
//   { name: "Shenzhen",       coordinates: [114.0579,22.5431],  auths: 12084000 },
//   { name: "Rio de Janeiro", coordinates: [-43.1729,-22.9068], auths: 11727000 },
//   { name: "Kinshasa",       coordinates: [15.2663,-4.4419],   auths: 11587000 },
//   { name: "Tianjin",        coordinates: [117.3616,39.3434],  auths: 10920000 },
//   { name: "Paris",          coordinates: [2.3522,48.8566],    auths: 10858000 },
//   { name: "Lima",           coordinates: [-77.0428,-12.0464], auths: 10750000 },
// ]

const projection = geoEqualEarth()
  .scale(320)
  .translate([ 800 , 450 ])

const WorldMap = () => {
  const [geographies, setGeographies] = useState([])
  const [cities, setCities] = useState([])
  const [maxAuths, setMaxAuths] = useState(0)

  useEffect(() => {
    fetch("/world-110m.json")
      .then(response => {
        if (response.status !== 200) {
          console.log(`There was a problem: ${response.status}`)
          return
        }
        response.json().then(worlddata => {
          setGeographies(feature(worlddata, worlddata.objects.countries).features)
        })
      })
  }, [])

  useEffect(() => {
    fetch("/auths-cities.json")
      .then(response => {
        if (response.status !== 200) {
          console.log(`There was a problem: ${response.status}`)
          return
        }
        response.json().then(citiesdata => {
          setMaxAuths(Math.max(...citiesdata.map(o => o.auths), 0))
          setCities(citiesdata)
        })
      })
  }, [])

  const handleCountryClick = countryIndex => {
    console.log("Clicked on country: ", geographies[countryIndex])
  }

  const handleMarkerClick = i => {
    console.log("Marker: ", cities[i])
  }

  var radius = scaleSqrt()
    .domain([0, maxAuths])
    .range([0, 20]);

  return (
    <svg width={ 1600 } height={ 900 } viewBox="0 0 1600 900">
      <g className="countries">
        {
          geographies.map((d,i) => (
            <path
              key={ `path-${ i }` }
              d={ geoPath().projection(projection)(d) }
              className="country"
              fill={ `rgba(221,221,221,1)` }
              stroke="#FFFFFF"
              strokeWidth={ 0.5 }
              onClick={ () => handleCountryClick(i) }
            />
          ))
        }
      </g>
      <g className={styles.marker}>
        {
          cities.sort((a, b) => b.auths - a.auths).map((city, i) => (
            <circle
              key={ `marker-${i}` }
              cx={ projection(city.coordinates)[0] }
              cy={ projection(city.coordinates)[1] }
              r={ radius(city.auths) }
              fill="#6dbf51"
              stroke="#FFFFFF"
              className="marker"
              name={city.name}
              onClick={ () => handleMarkerClick(i) }
            />
          ))
        }
      </g>
    </svg>
  )
}

export default WorldMap
