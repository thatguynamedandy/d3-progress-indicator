var ProgressIndicator = (function() {

  var arc = d3.svg.arc()
    .startAngle( function (d) {
      return d.startAngle;
    })
    .endAngle( function (d) {
      return d.endAngle;
    })
    .innerRadius(innerRadius)
    .outerRadius(radius);

  //Arc to position milestone labels
  var labelArc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius + xPadding);

  ProgressIndicator.prototype = {

    arcTween : function(d, i) {
      var i = d3.interpolate({
        startAngle: 0,
        endAngle: 0
      }, {
        startAngle: d.startAngle,
        endAngle: d.endAngle
      });

      return function(t) {
        var b = i(t);
        return arc(b);
      };
    },

    textTween : function(d, i) {
      var i = d3.interpolate(this.textContent, d);
      return function(t) {
        this.textContent = Math.round(i(t));
      };
    },

    milestoneTween : function(d, i) {
      var i = d3.interpolateRound(0, d.percentageCompleted),
          triangle = d3.select(this),
          value = d.value;
      return function(t) {
        if(value < Math.round(i(t))) {
          triangle.classed('active', true);
        }
      };
    }
  }

  function ProgressIndicator() {

    var opts = data = {};

    switch(arguments.length) {
      case 0 :
        throw "Please provide a data object for the indicator"
      case 1 :
        data = arguments[0];
        break;
      default
        opts = arguments[0];
        data = arguments[1];
    }

    var
    radius = opts.radius || 100,
    innerRadius = 45,
    xPadding = 100,
    yPadding = 20,
    width = radius * 2,
    milestoneRadius = innerRadius / 10,
    height = width,
    tweenDuration = 2500;


    var percentageCompleted = opts.percentageCompleted || 0;

    var arcData = [{
      startAngle:0,
      endAngle:(percentageCompleted / 100) * (Math.PI * 2)
    }];

    //Add Elements
    var svg = d3.select(opts.selector).append("svg:svg")
      .attr("width", width + (xPadding * 2))
      .attr("height", height + (yPadding * 2));

    var container = svg.append("svg:g")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + xPadding + "," + yPadding + ")");

    var indicator = container.append("svg:g")
      .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

    indicator.append("svg:circle")
      .attr("class", "outer-circle")
      .attr("r", radius);

    indicator.append("svg:circle")
      .attr("class", "inner-circle")
      .attr("r", innerRadius);

    indicator.append("svg:text")
      .attr("class", "total")
      .attr("dy", 15)
      .attr("dx", 18)
      .attr("text-anchor", "end")
      .data([percentageCompleted])
      .transition()
      .duration(tweenDuration)
      .tween("text", this.textTween);

    indicator.append("svg:text")
      .attr("class", "percent")
      .attr("dy", 15)
      .attr("dx", 27)
      .attr("text-anchor", "middle")
      .text("%");

    indicator.append("svg:path")
      .attr("class", "arc")
      .data(arcData)
      .transition()
      .duration(tweenDuration)
      .attrTween("d", this.arcTween);


    if(opts.milestones) {
      //Add a radian valuse for each milestone
      d3.map(opts.milestones).forEach(function(i, milestone) {
        milestone.radian = milestone.value / 100 * (2 * Math.PI);
        milestone.percentageCompleted = percentageCompleted;
      });

      svg.selectAll(".milestone")
        .data(opts.milestones)
        .enter()
        .append("path")
        .attr("d", "M  0 0 l -8 -8 l 16 0 z")
        .attr("class", "milestone")
        .attr("transform", function(d) {
          var x = (Math.sin(d.radian) * radius) + radius + xPadding,
            y = 0 - ((Math.cos(d.radian) * radius) - radius - yPadding),
            rotate = (d.radian * 180 / Math.PI);
          return "translate(" + x + "," + y + "), rotate (" + rotate + ")";
        })
        .transition()
        .duration(tweenDuration)
        .tween("acheivedMilstones", this.milestoneTween);

      indicator.selectAll(".milestone-text")
        .data(opts.milestones)
        .enter()
        .append("text")
        .attr("class", "milestone-text")
        .attr("dy", 4)
        .attr("text-content", function(d, i) {
          this.textContent = d.text;
        })
        .attr("text-anchor", function(d) {
          //TODO Is there a more suitable way to do this with D3
          if(d.value > 0 && d.value < 50 ) {
            return "start";
          }
          else if(d.value > 50 && d.value < 100 ) {
            return "end";
          }
          else if( d.value === 50 || d.value === 100 ) {
            return "middle";
          }
        })
        .attr("transform", function(d) {
          var x = (Math.sin(d.radian) * radius) + radius + xPadding,
            y = 0 - ((Math.cos(d.radian) * radius) - radius - yPadding);

          labelArc
            .endAngle(d.radian)
            .startAngle(d.radian);

          centroid = labelArc.centroid(d.radian);
          return "translate(" + centroid + ")";
        });
    }
  }

  return ProgressIndicator;
})();