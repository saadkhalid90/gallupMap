let topoWorld, gallupPoll, projection, path, colScale;

let params = {};
params.year = 2016;
params.groupType = 'Overall';
params.varType = 'OptimismScore';

let questions = {
  "OptimismScore": "How do you feel about the coming year? Do you think it would be better , worse ?",
  "EconScore": "How do you feel about the coming year in terms of Economy ? Do you think it would be better , worse ?",
  "HappinessScore": "In General Do you feel very Happy, Happy , Sad or Very Sad about your life?"
}

let indDesc = {
  "OptimismScore" : "Percentage who responded 'Better' - Percentage who responded 'Worse'",
  "EconScore" : "Percentage who responded 'Economic Prosperity' - Percentage who responded 'Economic Difficulty'",
  "HappinessScore" : "Percentage who responded 'Happy' - Percentage who responded 'Unhappy'"
}



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

  let legendComp = legendGroup.selectAll('rect.legendComponent')
            .data(d3.range(-75, 75+1, 75/5))
            .enter()


  legendComp.append('rect')
            .attr('class', 'legendComponent')
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

  legendGroup.append('text')
            .attr('class', 'indDesc')
            .text(d => {
              let value = document.getElementById('param').selectedOptions[0].value;
              return indDesc[value];
            })
            .attr('transform', (d, i) => {
              return `translate(0, +35)`
            })
            .style('text-anchor', 'start')
            .style('fill', 'black');

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

        let selectInd = document.getElementById('param').selectedOptions[0].value;
        let selectYear = document.getElementById('select_year').selectedOptions[0].value;
        let filtData = d.Gallup.filter(d => d.Year == selectYear & d.groupType == "Overall");

        let value = round2Dec(filtData[0][selectInd], 1);

        return document.getElementById('param').selectedOptions[0].innerText + ' : ' + value;
      }
    }
  });

  let selectInd = document.getElementById('param').selectedOptions[0].value;
  let selectYear = document.getElementById('select_year').selectedOptions[0].value;

  console.log(selectYear + selectInd);

  console.log(selection.selectAll('.country').data());

  console.log(selection.selectAll('.country').filter(d => d.Gallup).data());

  selection.selectAll('.country')
    .filter(d => d.Gallup)
    .filter(d => {
      console.log(selectInd + selectYear);
      let filtData = d.Gallup.filter(entry => entry.Year == selectYear & entry.groupType == "Overall")
      return filtData.length != 0;
    })

  selection.selectAll('.country')
    .filter(d => d.Gallup)
    .filter(d => {
      let selectInd = document.getElementById('param').selectedOptions[0].value;
      let selectYear = document.getElementById('select_year').selectedOptions[0].value;
      let filtData = d.Gallup.filter(entry => entry.Year == selectYear & entry.groupType == "Overall")
      return filtData.length != 0;
    })
    .on('mouseover', function(d){
      d3.select(this)
          .raise()
        .transition('mouseOTrans')
          .style('fill-opacity', '1');

      let node = this;

      selection
        .selectAll('.country')
        .filter(function(){
          return this !== node;
        })
        .transition('mouseOTrans')
          .style('opacity', 0.4);
        //.style('stroke-width', '2px')
        //.style('stroke', '#fff');*/

        selection
          .selectAll('.legendContainer rect')
          .transition('mouseOTrans')
            .style('opacity', 1);
    })
    .on('mouseout', function(d){
      /*d3.select(this)
        .transition()
          .style('stroke', '#212121');*/
      selection
        .selectAll('.country')
        .transition('mouseOTrans')
        .style('opacity', '0.7');



      selection
        .selectAll('.legendContainer rect')
        .transition('mouseOTrans')
          .style('opacity', 0.7);

      tooltip.removeTooltip(d);

    })
    .on('mousemove', function(d){
      tooltip.createTooltip(d, d3.event);
    });
}

function removeEventListener(selection){
  let paths = selection.selectAll('path.country');
  paths.on('mouseover', null);
  paths.on('mouseout', null);
  paths.on('mousemove', null);
}

function drawUpdate(selection, params){
  //selection.style('fill', 'none')
  selection.selectAll('path.country')
    .transition('updateTrans')
    .duration(1000)
    .call(setFill, color_threshold, params.year, params.groupType, params.varType);

  removeEventListener(selection);

  addEventListeners(selection);

  d3.selectAll('text.indDesc').text(indDesc[params.varType]);
  d3.select('p.QuestionText').html(questions[params.varType]);
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
  console.log(questions, question);
  //drawUpdate(d3.selectAll('path'), params);
  console.log(questions, question);
  d3.select('text.indDesc').text(questions[question]);
})

function round2Dec(num, digits){
  return Math.round(num * (10*digits))/(10*digits);
}
