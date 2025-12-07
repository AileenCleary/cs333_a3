
// uncomment desired metrics, organized by category.
const METRICS = {
    // population metrics

    "Population.Population Percent Change": "Population % Change",
    "Population.2014 Population": "Population (2014)",
    "Population.2010 Population": "Population (2010)",
    "Population.Population per Square Mile": "Population/Square Mile",

    // age metrics

    "Age.Percent Under 5 Years": "% Age < 5",
    "Age.Percent Under 18 Years": "% Age < 18",
    "Age.Percent 65 and Older": "% Age 65+",

    // miscellaneous

    "Miscellaneous.Percent Female": "% Female",
    "Miscellaneous.Veterans": "% Veterans",
    "Miscellaneous.Foreign Born": "% Foreign Born",
    "Miscellaneous.Living in Same House +1 Years": "% Cohabitation 1+ Yrs",
    "Miscellaneous.Language Other than English at Home": "% Multilingual Family",
    "Miscellaneous.Percent Under 66 Years With a Disability": "% Disability < 66",
    "Miscellaneous.Percent Under 65 Years Witout Health insurance": "% w/o Health Insurance < 65",
    // "Miscellaneous.Manufacturers Shipments": "Manufacturers Shipments",
    // "Miscellaneous.Mean Travel Time to Work": "Avg Commute Time",
    // "Miscellaneous.Land Area": "Land Area",

    // ethnicities

    "Ethnicities.White Alone": "% Caucasion",
    "Ethnicities.Black Alone": "% African American",
    "Ethnicities.American Indian and Alaska Native Alone": "% Native American/Indigenous",
    "Ethnicities.Asian Alone": "% Asian",
    "Ethnicities.Native Hawaiian and Other Pacific Islander Alone": "% Hawaiian/Pacific Islander",
    "Ethnicities.Two or More Races": "% 2+ Races",
    "Ethnicities.Hispanic or Latino": "% Hispanic/Latino",
    "Ethnicities.White Alone, not Hispanic or Latino": "% Caucasion w/o Hispanic/Latino",

    // housing

    "Housing.Housing Units": "Housing Units",
    "Housing.Homeownership Rate": "% Homeownership",
    "Housing.Median Value of Owner-Occupied Units": "Median Val Owner-Occupied Units",
    "Housing.Households": "Households",
    "Housing.Persons per Household": "Persons/Household",
    "Housing.Households with a computer": "% Households w/ Computer",
    "Housing.Households with a Internet": "% Households w/ Internet",

    // education

    "Education.High School or Higher": "% High School or Higher",
    "Education.Bachelor's Degree or Higher": "% Bachelor's Degree or Higher",

    // sales

    // "Sales.Accommodation and Food Services Sales": "Accomodation and Food Services Sales",
    // "Sales.Retail Sales": "Retail Sales",

    // income

    "Income.Median Houseold Income": "Median Household Income",
    "Income.Per Capita Income": "Per Capita Income",
    "Income.Persons Below Poverty Level": "% Below Poverty Line",

    // employment

    // "Employment.Nonemployer Establishments": "Non-Employer Establishments",
    // "Employment.Firms.Total": "Total Firms",
    // "Employment.Firms.Men-Owned": "Men-Owned Firms",
    // "Employment.Firms.Women-Owned": "Women-Owned Firms",
    // "Employment.Firms.Minority-Owned": "Minority-Ownded Firms",
    // "Employment.Firms.Nonminority-Owned": "Non-Minority-Owned Firms",
    // "Employment.Firms.Veteran-Owned": "Veteran-Owned Firms",
    // "Employment.Firms.Nonveteran-Owned": "Non-Veteran-Owned Firms",
    "Derived.IncomePerBachelor": "Income per Bachelor's %",
};

const METRIC_CATEGORIES = {
    "Population": [
        "Population.Population Percent Change",
        "Population.2014 Population",
        "Population.2010 Population",
        "Population.Population per Square Mile"
    ],
    "Age": [
        "Age.Percent Under 5 Years",
        "Age.Percent Under 18 Years",
        "Age.Percent 65 and Older"
    ],
    "Income": [
        "Income.Median Houseold Income",
        "Income.Per Capita Income",
        "Income.Persons Below Poverty Level",
        "Derived.IncomePerBachelor"
    ],
    "Education": [
        "Education.High School or Higher",
        "Education.Bachelor's Degree or Higher"
    ],
    "Housing": [
        "Housing.Homeownership Rate",
        "Housing.Median Value of Owner-Occupied Units",
        "Housing.Persons per Household",
        "Housing.Households with a computer",
        "Housing.Households with a Internet"
    ],
    "Demographic": [
        "Miscellaneous.Foreign Born",
        "Miscellaneous.Percent Female",
        "Miscellaneous.Percent Under 66 Years With a Disability",
        "Miscellaneous.Percent Under 65 Years Witout Health insurance",
        "Ethnicities.White Alone",
        "Ethnicities.Black Alone",
        "Ethnicities.American Indian and Alaska Native Alone",
        "Ethnicities.Asian Alone",
        "Ethnicities.Native Hawaiian and Other Pacific Islander Alone",
        "Ethnicities.Two or More Races",
        "Ethnicities.Hispanic or Latino",
        "Ethnicities.White Alone, not Hispanic or Latino",
    ]
};

const AXIS_KEYS = Object.keys(METRICS);

const appState = {
    data: [],
    xKey: null,
    yKey: null,
    selectedStates: new Set(),
    filters: []
};

const scatterSvg = d3.select("#scatterSvg");
const mapSvg = d3.select("#mapSvg"); // map placeholder TBD
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("pointer-events", "none");

const MAP_W = parseInt(mapSvg.style("width")) || 800;
const MAP_H = parseInt(mapSvg.style("height")) || 600;

const mapG = mapSvg
    .attr("viewBox", `0 0 ${MAP_W} ${MAP_H}`)
    .append("g");

let mapProjection = null;
let mapPath = null;
let geoStates = null;

let dataByState = new Map();

const mapColorScale = d3.scaleSequential()
    .interpolator(d3.interpolateBlues);

let mapMetricKey = null;

const SCATTER_W = parseInt(scatterSvg.style("width")) || 800;
const SCATTER_H = parseInt(scatterSvg.style("height")) || 600;
const margin = { top: 20, right: 20, bottom: 60, left: 70 };
const innerW = SCATTER_W - margin.left - margin.right;
const innerH = SCATTER_H - margin.top - margin.bottom;

const xScale = d3.scaleLinear()
    .range([0, innerW]);
const yScale = d3.scaleLinear()
    .range([innerH, 0]);
const rScale = d3.scaleSqrt()
    .range([3, 12]); // TBD scale by pop. if interesting.

const g = scatterSvg
    .attr("viewBox", `0 0 ${SCATTER_W} ${SCATTER_H}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xAxisG = g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .attr("class", "x-axis");
    
const yAxisG = g.append("g")
    .attr("class", "y-axis");

const xLabel = g.append("text")
    .attr("class", "x-label")
    .attr("text-anchor", "middle")
    .attr("x", innerW / 2)
    .attr("y", innerH + 45);

const yLabel = g.append("text")
    .attr("class", "y-label")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(-50, ${innerH/2}) rotate(-90)`);

const pointsG = g.append("g").attr("class", "points");
const brushG = g.append("g").attr("class", "brush");

// log any click on the SVG and its target element
d3.select("#scatterSvg").on("click.debug", event => {
  console.log("SVG click target:", event.target.tagName, event.target);
});

d3.csv("data/state_demographics.csv").then(rawData => {
    const data = rawData.map(d => {
        const parsed = { ...d };
        for (const k in d) {
            const v = d[k].replace(/^\s*"|"\s*$/g, "");
            const n = +v; // + operator converts str to int.
            if (!isNaN(n)) parsed[k] = n;
            else parsed[k] = v;
        }

        const income = +parsed["Income.Median Houseold Income"];
        const bachelors = +parsed["Education.Bachelor's Degree or Higher"];
        parsed["Derived.IncomePerBachelor"] =
            (isFinite(income) && isFinite(bachelors) && bachelors > 0)
                ? income / bachelors
                : NaN;

        return parsed;
    });
    appState.data = data;
    window.stateData = data; // global var iff nec. TBD

    dataByState = new Map(data.map(d => [d.State, d]));

    initAxisSelectors(data);

    const defaultX = "Education.Bachelor's Degree or Higher";
    const defaultY = "Income.Median Houseold Income";
    appState.xKey = defaultX;
    appState.yKey = defaultY;

    d3.select("#xSelect").property("value", defaultX);
    d3.select("#ySelect").property("value", defaultY);

    initFiltersUI();
    renderFilters();

    d3.json("data/us-states.json").then(usTopo => {
        initMap(usTopo, data, defaultY);
    });

    d3.select("#clearSelectionBtn").on("click", () => {
        appState.selectedStates.clear();
        updateSelectionStyles();
        renderSummaryTable();
        console.log("Selection cleared.");
    });

    updateScatter(defaultX, defaultY, data);
    drawBivariateLegend();
    renderSummaryTable();
    d3.select("#exportTableBtn").on("click", exportRankedCSV);
});

function initAxisSelectors(data) {
    const xSel = d3.select("#xSelect");
    const ySel = d3.select("#ySelect");

    xSel.selectAll("*").remove();
    ySel.selectAll("*").remove();

    const eduGroup = xSel.append("optgroup").attr("label", "Education");

    METRIC_CATEGORIES["Education"].forEach(key => {
        eduGroup.append("option")
            .attr("value", key)
            .text(METRICS[key]);
    });

    const incomeGroup = ySel.append("optgroup").attr("label", "Income");

    METRIC_CATEGORIES["Income"].forEach(key => {
        incomeGroup.append("option")
            .attr("value", key)
            .text(METRICS[key]);
    });

    if (!METRIC_CATEGORIES["Education"].includes(appState.xKey)) {
        appState.xKey = METRIC_CATEGORIES["Education"][0];
    }

    if (!METRIC_CATEGORIES["Income"].includes(appState.yKey)) {
        appState.yKey = METRIC_CATEGORIES["Income"][0];
    }

    xSel.property("value", appState.xKey);
    ySel.property("value", appState.yKey);
    xSel.on("change", () => {
        appState.xKey = xSel.property("value");
        updateScatter(appState.xKey, appState.yKey, appState.data);
        drawBivariateLegend();
        renderSummaryTable();
    });

    ySel.on("change", () => {
        appState.yKey = ySel.property("value");
        updateScatter(appState.xKey, appState.yKey, appState.data);
        drawBivariateLegend();
        renderSummaryTable();
    });
}

function initFiltersUI() {
    const addBtn = d3.select("#addFilterBtn");
    addBtn.on("click", () => {
        addFilter();
        renderFilters();
    });
}

function addFilter() {
    const defaultKey = AXIS_KEYS[0];

    const vals = appState.data
        .map(d => +d[defaultKey])
        .filter(v => isFinite(v));
    
    const min = d3.min(vals);
    const max = d3.max(vals);

    appState.filters.push({
        key: defaultKey,
        min,
        max
    });
}

function removeFilter(index) {
    appState.filters.splice(index, 1);
    renderFilters();
    updateAllVisualStyles();
    renderSummaryTable();
}

function renderFilters() {
    const list = d3.select("#filterList");
    list.selectAll("*").remove();

    appState.filters.forEach((f, i) => {
        const row = list.append("div")
            .attr("class", "filter-row");

        const sel = row.append("select");

        for (const [cat, keys] of Object.entries(METRIC_CATEGORIES)) {
            const group = sel.append("optgroup").attr("label", cat);

            keys.forEach(key => {
                group.append("option")
                    .attr("value", key)
                    .text(METRICS[key]);
            });
        }

        sel.property("value", f.key);

        sel.on("change", () => {
            f.key = sel.property("value");

            const vals = appState.data
                .map(d => +d[f.key])
                .filter(v => isFinite(v));

            f.min = d3.min(vals);
            f.max = d3.max(vals);

            renderFilters();
            updateAllVisualStyles();
            renderSummaryTable();
        });
        
        const vals = appState.data
            .map(d => +d[f.key])
            .filter(v => isFinite(v));

        const trueMin = d3.min(vals);
        const trueMax = d3.max(vals);

        row.append("span")
            .style("font-size", "11px")
            .style("color", "#555")
            .text(`min: ${formatValue(f.key, trueMin)}`);
        
        const minInput = row.append("input")
            .attr("type", "number")
            .attr("min", trueMin)
            .attr("max", trueMax)
            .attr("step", "any")
            .attr("value", f.min);
        
        row.append("span")
            .style("font-size", "11px")
            .style("color", "#555")
            .text(`max: ${formatValue(f.key, trueMax)}`);
        
        const maxInput = row.append("input")
            .attr("type", "number")
            .attr("min", trueMin)
            .attr("max", trueMax)
            .attr("step", "any")
            .attr("value", f.max);

        minInput.on("input", () => {
            f.min = +minInput.property("value");
            updateAllVisualStyles();
            renderSummaryTable();
        });

        maxInput.on("input", () => {
            f.max = +maxInput.property("value");
            updateAllVisualStyles();
            renderSummaryTable();
        });

        row.append("button")
            .text("✕")
            .on("click", () => removeFilter(i));
    });
}

function updateScatter(xKey, yKey, data) {
    if (!data) return;
    if (!xKey || !yKey) return;

    const plotData = data.filter( d => {
        return isFinite(+d[xKey]) && isFinite(+d[yKey]);
    });

    const xVals = plotData.map(d => +d[xKey]); // scales domains
    const yVals = plotData.map(d => +d[yKey]);
    xScale.domain(d3.extent(xVals)).nice();
    yScale.domain(d3.extent(yVals)).nice();

    // TBD optional scale by pop. **
    const popVals = data.map(d => +d["Population.2014 Population"]).filter(v => isFinite(v)); // ** can change to 2010 pop or % change or etc.
    rScale.domain(d3.extent(popVals));

    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("~s"));
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d3.format("~s"));
    xAxisG.transition().duration(300).call(xAxis);
    yAxisG.transition().duration(300).call(yAxis);
    xLabel.text(METRICS[xKey]);
    yLabel.text(METRICS[yKey]);

    const xDom = d3.extent(appState.data, d => +d[xKey]);
    const yDom = d3.extent(appState.data, d => +d[yKey]);

    const pts = pointsG.selectAll("circle")
        .data(plotData, d => d.State)
        .join(
            enter => enter.append("circle")
                .attr("cx", d => xScale(+d[xKey]))
                .attr("cy", d => yScale(+d[yKey]))
                .attr("r", 0)
                .attr("fill", d =>
                    bivariateColor(+d[xKey], +d[yKey], xDom, yDom)
                )
                // .attr("pointer-events", "all")
                .attr("stroke", "#333")
                .attr("stroke-width", 0.6),
            update => update
            // exit => exit.transition().duration(300).attr("r", 0).remove()
                .transition().duration(300)
                .attr("cx", d => xScale(+d[xKey]))
                .attr("cy", d => yScale(+d[yKey]))
                .attr("fill", d =>
                    bivariateColor(+d[xKey], +d[yKey], xDom, yDom)
                ),
            exit => exit.transition().duration(300).attr("r", 0).remove()
        );

    pts.style("cursor", "pointer");
    pts.raise();

    pts.transition()
        .duration(300)
        .attr("cx", d =>xScale(+d[xKey]))
        .attr("cy", d =>yScale(+d[yKey]))
        .attr("r", d => {
            const p = +d["Population.2014 Population"]; // **
            return isFinite(p) ? rScale(p) : 4;
        });
    
    pts.on("click", (event, d) => {
        const st = d.State;
        console.log("circle clicked", st);
        if (appState.selectedStates.has(st)) {
            appState.selectedStates.delete(st); 
        } else {
            appState.selectedStates.add(st);
        }
        updateSelectionStyles();
        renderSummaryTable();
    });
    
    pts.on("mouseover", (event, d) => {
            const hasSelection = appState.selectedStates.size > 0;
            const isSelected = appState.selectedStates.has(d.State);
            if (hasSelection && !isSelected) {
                tooltip.style("display", "none");
                return;
            }

            tooltip.style("display", "block")
                .html(`<strong>${d.State}</strong><br/>
                    ${METRICS[xKey]}: ${d[xKey]}<br/>
                    ${METRICS[yKey]}: ${d[yKey]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", (event, d) => {
            const hasSelection = appState.selectedStates.size > 0;
            const isSelected = appState.selectedStates.has(d.State);
            if (hasSelection && !isSelected) {
                tooltip.style("display", "none");
                return;
            }   
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });
    
    brushG.call(
        d3.brush()
            .extent([[0,0],[innerW,innerH]])
            .on("start brush end", brushHandler)
    ); 

    pointsG.raise();

    updateSelectionStyles();
    // pointsG.selectAll("circle").attr("fill", "steelblue").attr("opacity", 0.9);

    function brushHandler({ selection }) {
        if (!selection) {
            updateSelectionStyles();
            renderSummaryTable();
            return;
        }

        const [[x0,y0], [x1,y1]] = selection;
        const newlySelected = new Set();
        // const selected = [];

        pointsG.selectAll("circle").each(function(d) {
            const cx = xScale(+d[xKey]);
            const cy = yScale(+d[yKey]);
            const isInBrush = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
            if (isInBrush) newlySelected.add(d.State);
        });

        appState.selectedStates = newlySelected;
        updateSelectionStyles();
        renderSummaryTable();
    }
}

function updateSelectionStyles() {
    const hasSelection = appState.selectedStates.size > 0;
    const hasFilters = appState.filters.length > 0;

    const filterSet = hasFilters
        ? getFilteredStateSet()
        : null;

    pointsG.selectAll("circle")
        .attr("fill", d => {
            if (!hasSelection) {
                const vx = +d[appState.xKey];
                const vy = +d[appState.yKey];
                const xDom = d3.extent(appState.data, d => +d[appState.xKey]);
                const yDom = d3.extent(appState.data, d => +d[appState.yKey]);
                return bivariateColor(vx, vy, xDom, yDom);
            };
            return appState.selectedStates.has(d.State) ? "orange" : "#ddd";
        })
        .attr("opacity", d => {
            if (hasFilters) {
                return filterSet.has(d.State) ? 1.0 : 0.15;
            }
            if (hasSelection) {
                return appState.selectedStates.has(d.State) ? 1.0 : 0.4;
            } 
            return 0.9;
        });

    if (!geoStates) return;

    mapG.selectAll("path.state")
        .attr("stroke", d => {
            if (hasSelection && appState.selectedStates.has(d.properties.name)) {
                return "#000";
            }
            return "#fff";
        })
        .attr("stroke-width", d => {
            if (hasSelection && appState.selectedStates.has(d.properties.name)) {
                return 2.0;
            }
            return 0.5;
        })
        .attr("opacity", d=> {
            const st = d.properties.name;

            if (hasFilters && !filterSet.has(st)) {
                return 0.15;
            }
            if (hasSelection && !appState.selectedStates.has(st)) {
                return 0.4;
            }
            return 1.0;
        });
}

function initMap(usTopo, data, initialMetricKey) {
    geoStates = topojson.feature(usTopo, usTopo.objects.states);

    mapProjection = d3.geoAlbersUsa()
        .fitSize([MAP_W, MAP_H], geoStates);
    
    mapPath = d3.geoPath().projection(mapProjection);

    mapMetricKey = initialMetricKey || Object.keys(METRICS)[0];

    updateMapColors(mapMetricKey);
}

function updateMapColors(metricKey) {
    if (!geoStates || !dataByState) return;

    mapMetricKey = metricKey || mapMetricKey;

    const values = Array.from(dataByState.values())
        .map(d => +d[mapMetricKey])
        .filter(v => !isNaN(v));
    
    if (values.length == 0) {
        console.warn("No numeric values for metric:", mapMetricKey);
        return;
    }

    mapColorScale.domain(d3.extent(values));

    const states = mapG.selectAll("path.state")
        .data(geoStates.features, d => d.properties.name);

    states.join(
        enter => enter.append("path")
            .attr("class", "state")
            .attr("d", mapPath)
            .attr("fill", d => {
                const row = dataByState.get(d.properties.name);
                if (!row) return "#eee";

                const vx = +row[appState.xKey];
                const vy = +row[appState.yKey];

                return bivariateColor(vx, vy,
                    d3.extent(appState.data, dd => +dd[appState.xKey]),
                    d3.extent(appState.data, dd => +dd[appState.yKey])
                );
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("click", (event, d) => {
                const st = d.properties.name;
                if (appState.selectedStates.has(st)) {
                    appState.selectedStates.delete(st);
                } else {
                    appState.selectedStates.add(st);
                }
                updateSelectionStyles();
                renderSummaryTable();
            })
            .on("mouseover", (event, d) => {
                const hasSelection = appState.selectedStates.size > 0;
                const isSelected = appState.selectedStates.has(d.properties.name);
                
                if (hasSelection && !isSelected) {
                    tooltip.style("display", "none");
                    return;
                }

                const row = dataByState.get(d.properties.name);
                let html = `<strong>${d.properties.name}</strong><br/>
                ${METRICS[appState.xKey]}: ${formatValue(appState.xKey, row[appState.xKey])}<br/>
                ${METRICS[appState.yKey]}: ${formatValue(appState.yKey, row[appState.yKey])}<br/>`;

                appState.filters.forEach(f => {
                    html += `${METRICS[f.key]}: ${formatValue(f.key, row[f.key])}<br/>`;
                });

                tooltip.style("display", "block")
                    .html(html)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mousemove", (event, d) => {
                const hasSelection = appState.selectedStates.size > 0;
                const isSelected = appState.selectedStates.has(d.properties.name);

                if (hasSelection && !isSelected) return;

                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("display", "none");
            }),
        update => update
            .transition().duration(300)
            .attr("fill", d => {
                const row = dataByState.get(d.properties.name);
                if (!row) return "#eee";

                const vx = +row[appState.xKey];
                const vy = +row[appState.yKey];

                return bivariateColor(vx, vy,
                    d3.extent(appState.data, dd => +dd[appState.xKey]),
                    d3.extent(appState.data, dd => +dd[appState.yKey])
                );
            })
    );
    updateSelectionStyles();
    renderSummaryTable();
}

function bivariateColor(vx, vy, xDomain, yDomain) {
    const tx = (vx - xDomain[0]) / (xDomain[1] - xDomain[0]);
    const ty = (vy - yDomain[0]) / (yDomain[1] - yDomain[0]);

    const r = Math.round(255*tx);
    const b = Math.round(255*ty);
    const g = 80;

    return `rgb(${r},${g},${b})`;
}

function drawBivariateLegend() {
    const container = d3.select("#bivariateLegend")
        .html("");
    
    container.append("div")
        .style("font-size", "13px")
        .style("margin-bottom", "6px")
        .html(`
            <div><strong>Color Encoding</strong></div>
            <div style="font-size:12px; color:#555;">
                Bottom-left = Low ${METRICS[appState.xKey]} & Low ${METRICS[appState.yKey]}<br>
                Top-right = High ${METRICS[appState.xKey]} & High ${METRICS[appState.yKey]}
            </div>
        `);

    const xDom = d3.extent(appState.data, d => +d[appState.xKey]);
    const yDom = d3.extent(appState.data, d => +d[appState.yKey]);

    container.append("div")
        .style("margin-bottom", "6px")
        .html(`<strong>${METRICS[appState.xKey]}</strong> ⟶`);

    container.append("div")
        .style("margin-bottom", "10px")
        .style("font-size", "12px")
        .html(`min: ${formatValue(appState.xKey, xDom[0])} &nbsp;&nbsp; max: ${formatValue(appState.xKey, xDom[1])}`);

    const grid = container.append("div")
        .attr("class", "legend-grid");

    for (let y = 4; y >= 0; y--) {
        for (let x = 0; x < 9; x++) {
            const vx = xDom[0] + (x / 8) * (xDom[1] - xDom[0]);
            const vy = yDom[0] + (y / 4) * (yDom[1] - yDom[0]);

            grid.append("div")
                .attr("class", "legend-cell")
                .style("background", bivariateColor(vx, vy, xDom, yDom));
        }
    }

    container.append("div")
        .style("margin-top", "10px")
        .html(`<strong>${METRICS[appState.yKey]}</strong> ↑`);

    container.append("div")
        .style("font-size", "12px")
        .html(`min: ${formatValue(appState.yKey, yDom[0])} &nbsp;&nbsp; max: ${formatValue(appState.yKey, yDom[1])}`);
}


function getFilteredStateSet() {
    const baseSet = new Set(appState.data.map(d => d.State));

    appState.filters.forEach(f => {
        for (const st of Array.from(baseSet)) {
            const row = appState.data.find(d => d.State === st);
            const val = +row[f.key];
            if (!(f.min <= val && val <= f.max)) {
                baseSet.delete(st);
            }
        }
    });

    return baseSet;
}

function updateAllVisualStyles() {
    updateSelectionStyles();
}

function getRankedStates() {
    let baseSet;

    // const hasSelection = appState.selectedStates.size > 0;
    const hasFilters = appState.filters.length > 0;

    if (hasFilters) {
        baseSet = Array.from(getFilteredStateSet());
    // } else if (hasFilters) {
    //     baseSet = Array.from(getFilteredStateSet());
    } else {
        baseSet = appState.data.map(d => d.State);
    }

    const rows = baseSet.map(st => {
        const row = appState.data.find(d => d.State === st);
        const xVal = +row[appState.xKey];
        const yVal = +row[appState.yKey];
        return { state: st, xVal, yVal };
    });

    const xExtent = d3.extent(rows, d => d.xVal);
    const yExtent = d3.extent(rows, d => d.yVal);

    rows.forEach(d => {
        const xDen = (xExtent[1] - xExtent[0]);
        const yDen = (yExtent[1] - yExtent[0]);

        const xn = xDen === 0 ? 0.5 :
            (d.xVal - xExtent[0]) / xDen;

        const yn = yDen === 0 ? 0.5 :
            (d.yVal - yExtent[0]) / yDen;

        d.score = xn + yn;
    });

    rows.sort((a, b) => d3.descending(a.score, b.score));
    return rows;
}

function renderSummaryTable() {
    const ranked = getRankedStates();

    const theadRow = d3.select("#summaryTable thead tr");
    const tbody = d3.select("#summaryTable tbody");
    theadRow.selectAll(".filter-header").remove();
    tbody.selectAll("*").remove();

    d3.select("#xHeader").text(METRICS[appState.xKey]);
    d3.select("#yHeader").text(METRICS[appState.yKey]);

    appState.filters.forEach(f => {
        theadRow.append("th")
            .attr("class", "filter-header")
            .text(METRICS[f.key]);
    });

    ranked.forEach((d, i) => {
        const tr = tbody.append("tr")
            .style("cursor", "pointer")
            .on("click", () => {
                const st = d.state;
                if (appState.selectedStates.has(st)) {
                    appState.selectedStates.delete(st);
                } else {
                    appState.selectedStates.add(st);
                }

                updateAllVisualStyles();
                renderSummaryTable();
            });
        const isSelected = appState.selectedStates.has(d.state);
        tr.style("background", isSelected ? "#ffe0b2" : null)
            .style("opacity", appState.selectedStates.size > 0 && !isSelected ? 0.4 : 1.0);
        tr.append("td").text(i + 1);
        tr.append("td").text(d.state);
        tr.append("td").text(formatValue(appState.xKey, d.xVal));
        tr.append("td").text(formatValue(appState.yKey, d.yVal));
        tr.append("td").text(d.score.toFixed(3));

        appState.filters.forEach(f => {
            const row = appState.data.find(r => r.State === d.state);
            const val = +row[f.key];
            tr.append("td").text(formatValue(f.key, val));
        });
    });
}

function exportRankedCSV() {
    const ranked = getRankedStates();

    let csv = "Rank,State," +
        METRICS[appState.xKey] + "," +
        METRICS[appState.yKey] + ",Combined Score\n";

    ranked.forEach((d, i) => {
        csv += `${i+1},${d.state},${d.xVal},${d.yVal},${d.score}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ranked_states.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatValue(metricKey, value) {
    if (!isFinite(value)) return "N/A";

    const label = METRICS[metricKey];

    if (label.includes("%")) {
        return d3.format(".1f")(value) + "%";
    }
    if (label.toLowerCase().includes("income")) {
        return "$" + d3.format(",")(Math.round(value));
    }
    if (label.toLowerCase().includes("value")) {
        return "$" + d3.format(",")(Math.round(value));
    }
    if (label.toLowerCase().includes("population")) {
        return d3.format(",")(Math.round(value));
    }

    return d3.format(",.2f")(value);
}


window.debugFilters = () => console.log(appState.filters);
