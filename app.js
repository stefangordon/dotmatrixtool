var matrix;
var $table;
var rowMajor = false;
var msbendian = false;

$(function() {
  	matrix = createArray(16,16);
  	updateTable();
	initOptions();

	$('#_output').hide();
});

function updateTable() {
	var width = matrix[0].length;
	var height = matrix.length;

	$('#_grid').html('');
	$('#_grid').append(populateTable(null, height, width, matrix));

	// events
	$table.on("mousedown", "td", toggle);
    $table.on("mouseenter", "td", toggle);
    $table.on("dragstart", function() { return false; });
}

function initOptions() {
	$('#clearButton').click(function() { matrix = createArray(matrix.length,matrix[0].length); updateTable(); $('#_output').hide();});
	$('#generateButton').click(updateCode);
	$('#readButton').click(readData);
	
	 $('#widthDropDiv li a').click(function () {
	 	var width = parseInt($(this).html());
	 	var height = matrix.length;
        matrix = createArray(height, width);
        updateTable();
        updateSummary();
     });

     $('#heightDropDiv li a').click(function () {
	 	var width = matrix[0].length;
	 	var height = parseInt($(this).html());
        matrix = createArray(height, width);
        updateTable();
        updateSummary();
     });

     $('#byteDropDiv li a').click(function () {
	 	var selection = $(this).html();
        rowMajor = selection.startsWith("Row");  
        updateSummary();      	
     });

     $('#endianDropDiv li a').click(function () {
	 	var selection = $(this).html();
        msbendian = selection.startsWith("Big");  
        updateSummary();      	
     });

     updateSummary();
}

function updateSummary() {
	var width = matrix[0].length;
	var height = matrix.length;
	var summary = width + "px by " + height + "px, ";

	if (rowMajor) summary += "row major, ";
	else summary += "column major, ";

	if (msbendian) summary += "big endian.";
	else summary += "little endian.";

	$('#_summary').html(summary);
}

function updateCode() {
	$('#_output').show();
	var bytes = generateByteArray();
	var output = "const uint_8 data[] =\n{\n" + bytes + "\n};"
	$('#_output').html(output);
	$('#_output').removeClass('prettyprinted');
	prettyPrint();
}

function readData() {
	var bytestr = prompt("Input your data here, in hex format: 0x1, 0x2");
	if (!bytestr) return;
	var width = matrix[0].length;
	var height = matrix.length;
	var height = matrix[0].length;
	var bytes = bytestr.split(',').map(function (x) { return parseInt(x)});
	
	var byteinarow=Math.ceil(width/8);
	var byteinacol=Math.ceil(height/8);
	var byteindex ;
	var bitindex;
	for (var y=0;y<height;y++) {
		for(var x=0;x<width;x++) {
			if (rowMajor) {
			    byteindex = y*byteinarow + Math.floor(x/8);
			    bitindex = x%8;
			} else {
				byteindex = x*byteinacol + Math.floor(y/8);
				bitindex = y%8;
			}
			if (msbendian) bitindex = 7-bitindex;
			matrix[y][x] = (bytes[byteindex] >> bitindex) & 0x1;
		}
	}
	updateTable();
	updateSummary();
	updateCode();
}


function generateByteArray() {
	var width = matrix[0].length;
	var height = matrix.length;
	var buffer = new Array(width * height);
	var bytes = new Array((width * height) / 8);

	// Column Major
	var temp;
	for (var x = 0; x < width; x++) {
		for (var y = 0; y < height; y++) {
			temp = matrix[y][x];
			if (!temp) temp = 0;
			// Row Major or Column Major?
			if (!rowMajor) {
				buffer[x * height + y] = temp;	
			}
			else {
				buffer[y * width + x] = temp;
			}
			
		}
	}

	// Read buffer 8-bits at a time
	// and turn it into bytes
	for (var i = 0; i < buffer.length; i+=8) {
		var newByte = 0;
		for (var j = 0; j < 8; j++) {
            if (buffer[i+j]) {
            	if (msbendian) {
                	newByte |= 1 << (7-j);
                }
                else {
                	newByte |= 1 << j;
                }
            }
        }
        bytes[i / 8] = newByte;
	}

	var formatted = bytes.map(function (x) {
	    x = x + 0xFFFFFFFF + 1;  // twos complement
	    x = x.toString(16); // to hex
	    x = ("0"+x).substr(-2); // zero-pad to 8-digits
	    x = "0x" + x;
	    return x;
	}).join(', ');

	return formatted;
}

function toggle(e) {
	var x = $(this).data('i');
	var y = $(this).data('j');

	if (e.buttons == 1 && !e.ctrlKey) {
		matrix[x][y] = 1;
		$(this).addClass('on');		
	}
	else if (e.buttons == 2 || (e.buttons == 1 && e.ctrlKey)) {			
		matrix[x][y] = 0;
		$(this).removeClass('on');	
	}

	return false;
}

function populateTable(table, rows, cells, content) {
    if (!table) table = document.createElement('table');
    for (var i = 0; i < rows; ++i) {
        var row = document.createElement('tr');
        for (var j = 0; j < cells; ++j) {
            row.appendChild(document.createElement('td'));
            $(row.cells[j]).data('i', i);
            $(row.cells[j]).data('j', j);
			if (content[i][j]) {
				$(row.cells[j]).addClass('on');
			}
        }
        table.appendChild(row);
    }
    $table = $(table);
    return table;
}

// (height, width)
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}