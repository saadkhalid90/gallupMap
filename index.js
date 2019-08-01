let topoWorld, gallupPoll, projection, path, colScale;

let params = {};
params.year = 2016;
params.groupType = 'Overall';
params.varType = 'OptimismScore';

async function readAndDraw(){
  let data = await Promise.all([d3.json('worldMap.topojson'),d3.csv('gallupSum.csv')]);
  topoWorld = topology = topojson.presimplify(data[0]);
  topoWorld = topojson.simplify(topoWorld,0.3)
  gallupPoll = data[1];

  colScale = d3.scaleSequential(d3.interpolatePuOr)
    	.domain([75, -75]);

  var steps = 11;
  //Discrete diverging scale
  color_threshold = d3.scaleThreshold()
    	.domain(d3.range(-75 + 150/steps, 75, +150/steps) ) //[-.6, -.2, .2, .6]
  	  .range(d3.schemePuOr[steps].reverse()); //=> 5 colors in an array

  // define a projection that will be used to make the map
  projection = d3.geoRobinson()
    .scale(150 * 1.4)
    .center([-30,23])

  // this path will be used to compute the d feature of each geometrical path in a map
  path = d3.geoPath().projection(projection);

  // This converts a json into an array each element corresponding to one path
  let pathWorld = topojson.feature(topoWorld, topoWorld.objects.worldMap).features;

  // get an array of paths without the path of Antarctica
  let pathWorld_ = pathWorld.filter(d => d.properties.ADMIN != "Antarctica");

  let SVG = d3.select('svg.GallupPollInd')

  let pathWData = joinSumWithMap(pathWorld_, gallupPoll);

  draw(SVG, pathWData, params);

}

function draw(selection, data, params){

  selection.append('g')
    .attr('class', 'background')
  .append('rect')
    .attr('width', selection.node().width.baseVal.value)
    .attr('height', selection.node().height.baseVal.value)
    .attr('fill', 'none')
    .attr('stroke', 'none');

  selection.append('g')
    .attr('class', 'Map')
    .selectAll('path.country')
    .data(data)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .call(setFill, color_threshold, params.year, params.groupType, params.varType)
    .style('stroke', '#212121')
    .style('opacity', 0.7)
    .style('stroke-width', '1px')
    .style('pointer-events', 'visible');

  let legendGroup = selection.append('g')
          .attr('transform', 'translate(20, 600)')
          .attr('class', 'legendContainer');

  let legendComp = legendGroup.selectAll('g.legendComponent')
            .data(d3.range(-75, 75+1, 75/5))
            .enter()
            .append('g')
            .attr('class', 'legendComponent')

  legendComp.append('rect')
            .attr('width', 25)
            .attr('height', 10)
            .attr('transform', (d, i) => {
              return `translate(${i*25}, 0)`
            })
            .style('fill', d => color_threshold(d))
            .style('opacity', 0.7);
            // .style('stroke', 'black')
            // .style('stroke-width', '0.5px');

  legendComp.append('text')
            .text(d => Math.round(d))
            .attr('transform', (d, i) => {
              return `translate(${i*25 + 25/2}, -5)`
            })
            .style('text-anchor', ' middle')
            .style('fill', d => [-75, 75, 0].includes(d) ? 'black': 'none');

  addEventListeners(selection);
}

function addEventListeners(selection){

  let tooltip = Tooltip({
    idPrefix : 'w-tooltip',
    dataId : 'index',
    templateSelector : '#w-tooltip',
    selectorDataMap : {
      '.s-p__tooltip-header h1' : function(d){
        return d.properties.ADMIN;
      },
      '.s-p__tooltip-header img' : function(d){
        return `./flags/${d.properties.ADMIN.toLowerCase().replace(/ /g,'-')}.svg`;
      },
      '.s-p__tooltip-body p' : function(d) {
        return document.getElementById('param').selectedOptions[0].innerText + ' : very high';
      }
    }
  });
  selection
    .selectAll('.country')
    .on('mouseover', function(d){
      d3.select(this)
          .raise()
        .transition()
          .style('opacity', '1');

      let node = this;

      selection
        .selectAll('.country')
        .filter(function(){
          return this !== node;
        })
        .transition()
          .style('opacity', 0.4);
        //.style('stroke-width', '2px')
        //.style('stroke', '#fff');*/

        selection
          .selectAll('.legendContainer rect')
          .transition()
            .style('opacity', 1);
    })
    .on('mouseout', function(d){
      /*d3.select(this)
        .transition()
          .style('stroke', '#212121');*/
      selection
        .selectAll('.country')
        .transition()
        .style('opacity', '0.7');



      selection
        .selectAll('.legendContainer rect')
        .transition()
          .style('opacity', 0.7);

      tooltip.removeTooltip(d);

    })
    .on('mousemove', function(d){
      tooltip.createTooltip(d, d3.event);
    });
}

function drawUpdate(selection, params){
  //selection.style('fill', 'none')
  selection.transition()
    .duration(1000)
    .call(setFill, color_threshold, params.year, params.groupType, params.varType);
}

function setFill(selection, colScaleVar, year, groupType, varType){
  selection.style('fill', d => {
    if (d.Gallup){
      let filtData = d.Gallup.filter(d => d.Year == year & d.groupType == groupType);
      if (filtData.length > 0){
        //return colScale(+filtData[0][varType]);
        return colScaleVar(+filtData[0][varType]);
      }
      else {
        return 'rgba(255,255,255,0)';
      }
    }
    else {
      return 'rgba(255,255,255,0)';
    }
  })
}

readAndDraw();


function joinSumWithMap(pathData, GallupData){
  pathData.forEach(pathCountry => {
    let countryCode = pathCountry.properties.ADM0_A3;
    let GallupDatCty = GallupData.filter(d => d.code == countryCode);

    if (GallupDatCty.length > 0){
      pathCountry.Gallup = GallupDatCty;
    }
  })
  return pathData;

}

d3.selectAll('.selectors').on('input', function(d, i){
  let year = d3.select('.year.selector').node().value;
  let question = d3.select('.question.selector').node().value;

  let params = {};
  params.year = year;
  params.groupType = 'Overall';
  params.varType = question;

  drawUpdate(d3.selectAll('path'), params);
})
