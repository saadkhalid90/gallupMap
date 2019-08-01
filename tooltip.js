function Tooltip({
	idPrefix = 'tooltip',
	dataId = 'ttIndex',
	templateSelector,
	selectorDataMap,
	stylingFunc = function(){},
	opacity,
	defaultWidth = 300,
	defaultHeight = 200
} = {}){

	var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));

	function getCounter(){
		var val = 1;

		return {
			getVal : function(){
				return val++;
			}
		};
	}

	var counter = getCounter();
	var currTooltip;

	function createTooltip(d, event,i){
		if(!d[dataId]){
			d[dataId] = counter.getVal();
		}

		var tooltipElement = document.getElementById(idPrefix + d[dataId]);
		if(!tooltipElement){

			var tooltip = d3.select(cloneTooltipFromTemplate.call(this,d,i));

			currTooltip = tooltip;

			tooltip
					.attr('id',idPrefix + d[dataId])
					.style('position', 'fixed')
					.style('opacity', 0);

			stylingFunc(tooltip,d);

			d3.select('body').append(function(){
				return tooltip.node();
			});

			let finalPos = getTooltipPosition(event, tooltip.node());

			tooltip
					.style('z-index',10000)
					.style('left', finalPos[0] + 'px')
					.style('top', finalPos[1] + 'px')
					.transition()
					.duration(300)
					.style('opacity', 1);

			if(isTouch){
				window.addEventListener('touchend', touchListener);
				/*tooltip.node().addEventListener('touchend', function(e){
					e.preventDefault();
					e.stopPropagation();
				});*/
			}

		}else{
			let finalPos = getTooltipPosition(event, tooltipElement);

			tooltipElement.style.left = finalPos[0] + 'px';
			tooltipElement.style.top = finalPos[1] + 'px';
		}
	}

	function getTooltipPosition(event,tooltip){

		tooltip = tooltip.children[0];


		if((tooltip.offsetWidth * 2) > window.innerWidth){
			return getMobileTooltipPosition(event, tooltip);
		}else{
			return getLargeTooltipPosition(event, tooltip);
		}
	}

	function getLargeTooltipPosition(event, tooltip){

		var x = event.clientX,
			y = event.clientY,
			windowWidth = window.innerWidth,
			windowHeight = window.innerHeight,
			elemWidth = tooltip.offsetWidth,
			elemHeight = tooltip.offsetHeight,
			offset = 20;

		if(!elemHeight || !elemWidth){
			var style = window.getComputedStyle(tooltip);
			elemWidth = style.width;
			elemHeight = style.height;
			console.log(elemWidth, elemWidth);
			console.log('Not defined');
		}

		var finalX, finalY;

		if(x + elemWidth  + offset < windowWidth){
			finalX = x + offset;
		}else{
			finalX = x - elemWidth - offset;
		}

		if(y + elemHeight  + offset < windowHeight){
			finalY = y + offset;
		}else{
			finalY = y - elemHeight - offset;
		}

		return [finalX, finalY];
	}

	function getMobileTooltipPosition(event, tooltip){

		var x = event.clientX,
			y = event.clientY,
			windowWidth = window.innerWidth,
			windowHeight = window.innerHeight,
			elemWidth = tooltip.offsetWidth,
			elemHeight = tooltip.offsetHeight,
			offset = 20;

			var finalX, finalY;

			finalX = (windowWidth - elemWidth)/2;

			if(y + elemHeight  + offset < windowHeight){
				finalY = y + offset;
			}else{
				finalY = y - elemHeight - offset;
			}

			return [finalX, finalY];
	}

	function cloneTooltipFromTemplate(d,i){

		var template = document.querySelector(templateSelector);
		var clone = document.importNode(template.content, true);

		for(var j in selectorDataMap){
			var mappedData = selectorDataMap[j];

			var res;

			if(typeof mappedData === 'function'){
				res = mappedData.call(this,d,i);
			}else{
				res = d[mappedData];
			}

			let elem = clone.querySelector(j);

			if(elem instanceof HTMLImageElement){
				elem.src = res;
			}else{
				elem.innerText = res;
			}
		}

		var container = document.createElement('div');

		container.appendChild(clone);
		return container;
	}

	function removeTooltip(d){
		var tooltip = document.getElementById(idPrefix + d[dataId]);

		if(tooltip){
			d3.select(tooltip)
				.transition()
				.duration(100)
				.style('opacity', 0)
				.on('end', function(){
					currTooltip = null;
				})
				.remove();
		}

		if(isTouch){
			window.removeEventListener('touchend', touchListener);
		}
	}

	function touchListener(e){
		if(currTooltip){
			currTooltip
				.transition()
				.duration(100)
				.style('opacity', 0)
				.on('end', function(){
					currTooltip = null;
				})
				.remove();
				window.removeEventListener('touchend', touchListener);
		}
	}

	return {
		createTooltip : createTooltip,
		removeTooltip : removeTooltip
	};
}