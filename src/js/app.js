import * as d3 from 'd3'
import * as d3g from 'd3-geo-projection'
import * as topojson from 'topojson'
import rainbow from 'rainbowvis.js'

Object.assign(d3, d3g)

const layers = ['mask', 'sphere', 'graticule', 'land', 'countries']

const countriesWeight = ['Brazil', 'Mexico', 'Colombia', 'Argentina', 'Dominican Republic', 'Peru', 'Bolivia', 'Guatemala', 'Ecuador', 'Costa Rica', 'Uruguay', 'Chile', 'United States of America', 'El Salvador', 'Venezuela', 'Honduras', 'Paraguay', 'Nicaragua', 'Panama', 'Spain', 'Canada', 'India', 'Romania', 'United Kingdom', 'Russia', 'Trinidad & Tobago', 'Philippines', 'Poland', 'Ireland', 'Netherlands']

const strongColor = 'yellow'
const lightColor = '#EE9900'
const offColor = '#a4cae0'
const snowColor = offColor

const colors = new rainbow()
colors.setNumberRange(0, countriesWeight.length-1).setSpectrum(strongColor, lightColor)

const mapProjection = 'geoOrthographic'
const mapRotation = [50, -20, 0]

// const mapProjection = 'geoNaturalEarth1'
// const mapRotation = [0, 0, 0]

async function init() {

	renderPalette()
	
	const world = await fetcher('../../data/world-atlas-110m.json')
	const countries = await fetcher('../../data/ne_10m_admin_0_countries_simp.json')

	const geoLayers = dataToLayers(
		topojson.feature(world, world.objects.land).features,
		topojson.feature(countries, countries.objects.ne_10m_admin_0_countries).features
	)

	render(geoLayers)
}

async function fetcher(request){
    return fetch(request)
        .then(response => response.json())
        .then(data => data)
        .catch(error => console.error(error))
}

function renderPalette() {
	countriesWeight.forEach((c, i) => {
		const div = document.createElement('div')
		div.append(c)

		document.querySelector('nav').appendChild(div)

		div.setAttribute('style', `background-color: #${colors.colourAt(i)}`)

		div.setAttribute('title', c)
	})
}

function dataToLayers(land, countries) {	
    return layers.filter(d => !['countries', 'land'].includes(d)).reduce((a, d) => {
		return {...a, [d]: land}
	}, {countries, land: countries})
}

function render(geoLayers) {

    const domElements = {}

    const svg = d3.select('[data-map]')

    svg.attr('viewBox', '0 0 960 484')

    domElements['mask'] = svg
		.append('clipPath')
        .attr('id', 'mask')

    layers.forEach(layer => {        
        if(layer != 'mask'){
            domElements[layer] = svg.append('g')
            .attr('class', 'group-' + layer)
            .attr('clip-path', layer !== 'sphereline' ? 'url(#mask)' : '')
        }
    })
    
    const path = d3.geoPath()
    const graticule = d3.geoGraticule10()
    const projection = d3[mapProjection]()
        .center([0, 0])
        .rotate(mapRotation)
        .fitExtent([[0, 0], [960, 484]], {type: 'Sphere'})

    path.projection(projection)

    layers.forEach(layer => {
        
        let d = domElements[layer].selectAll('path')

        const data = geoLayers[layer]
            
		d.data(data).enter().append('path')

		d = domElements[layer].selectAll('path')

		switch(layer) {
			case 'mask':
			case 'sphere':
			case 'sphereline':
				d.attr('d', path({type: 'Sphere'}))
				break

			case 'graticule':
				d.attr('d', path(graticule))
				break

			default:
				d.attr('d', path)
		}

		if(layer === 'countries') {

			d.attr('fill', (d) => {
				const name = d.properties.ADMIN
				if(['Antarctica', 'Greenland'].includes(name))
					return snowColor
				if(countriesWeight.includes(name))
					return '#' + colors.colourAt(countriesWeight.indexOf(name))
				else
					return offColor
			})

			/* d.on('mouseover', function(e, d) {
				console.log(d.properties.ADMIN)	
			}) */
		}
    })
}

export default init