$(function () {

    d3.csv('medicines.csv', function (data) {
        main(data)
    });

    var tableTemplate = $([
        "<table class='table table-hover table-condensed table-striped'>",
        " <caption></caption>",
        " <thead><tr/></thead>",
        " <tbody></tbody>",
        "</table>"
    ].join('\n'));
    CreateTable = function (data, variablesInTable, title) {
        var table = tableTemplate.clone();
        var ths = variablesInTable.map(function (v) {
            return $("<th>").text(v)
        });
        $('caption', table).text(title);
        $('thead tr', table).append(ths);
        data.forEach(function (row) {
            var tr = $("<tr>").appendTo($('tbody', table));
            variablesInTable.forEach(function (varName) {
                var val = row, keys = varName.split('.');
                keys.forEach(function (key) { val = val[key] });
                tr.append($("<td>").text(val));
            });
        });
        return table;
    }

    main = function (inputdata) {
        var medicineData = inputdata;
        var dateFormat = d3.time.format("%d/%m/%Y");
        medicineData.forEach(function (d) {
            d.Day = dateFormat.parse(d.Date);
        })
        var variablesInTable = ['MedName', 'StockIn', 'StockOut', 'Stock', 'Date', 'LightSen']
        var sample = medicineData.slice(0, 5);
        var inputTable = $("#inputtable");
        inputTable.empty().append(CreateTable(sample, variablesInTable, "The input table"));

        //Сортировка по названию лекарства, первые 5 результатов
        CrossfilterInstance = crossfilter(medicineData);

        var medNameDim = CrossfilterInstance.dimension(function(d) {
            return d.MedName;
        });

        var dataFiltered= medNameDim.filter('Grazax 75 000 SQ-T')
        var filteredTable = $('#filteredtable');
        filteredTable.empty().append(CreateTable(dataFiltered.top(5), variablesInTable, 'Our First Filtered Table'));
        //

        //Сортировка по дате, первые 5 результатов
        var DateDim = CrossfilterInstance.dimension(
            function(d) {return d.Day;});

        filteredTable.empty().append(CreateTable(DateDim.bottom(5),variablesInTable,'Our First Filtered Table'));
        //

        //Вывод обобщеной информации, количество всех записей о лекарстве
        var countPerMed = medNameDim.group().reduceCount();
        variablesInTable = ["key","value"]
        filteredTable.empty().append(CreateTable(countPerMed.top(Infinity), variablesInTable, 'Reduced Table'));
        //

        //3 функции для не стандартного вывода библиотеки Crossfilter

        //Функция задает начальные значения для всех вычисляемых показателей
        var reduceInitAvg = function(p,v){
            return {count: 0, stockSum : 0, stockAvg:0};
        }
        //
        
        //Функция, которая описывает, что должно происходить при добавлении нового наблюдения
        var reduceAddAvg = function(p,v){
            p.count += 1;
            p.stockSum = p.stockSum + Number(v.Stock);
            p.stockAvg = Math.round(p.stockSum / p.count);
            return p;
        }
        //

        //Функция, которая описывает, что должно происходить при исключении наблюдения
        var reduceRemoveAvg = function(p,v){
            p.count -= 1;
            p.stockSum = p.stockSum - Number(v.Stock);
            p.stockAvg = Math.round(p.stockSum / p.count);
            return p;
        }
        //

        //Применем наш MapReduce к набору данных
        dataFiltered = medNameDim.group().reduce(reduceAddAvg, reduceRemoveAvg, reduceInitAvg) 
        variablesInTable = ["key","value.stockAvg"] 
        filteredTable.empty().append(CreateTable(dataFiltered.top(Infinity),variablesInTable,'Reduced Table'));
        //
    }

})