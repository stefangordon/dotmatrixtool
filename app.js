"use strict";
var matrix;
var $table;
var rowMajor = false;
var msbendian = false;
var selectedFormat = 'c';

$(function() {
  var savedWidth = parseInt(localStorage.getItem('dm_width'));
  if (isNaN(savedWidth) || savedWidth <= 0) savedWidth = 16;
  var savedHeight = parseInt(localStorage.getItem('dm_height'));
  if (isNaN(savedHeight) || savedHeight <= 0) savedHeight = 16;
  rowMajor = localStorage.getItem('dm_rowMajor') === '1';
  msbendian = localStorage.getItem('dm_msbendian') === '1';
  var savedFormat = localStorage.getItem('dm_format');
  if (savedFormat === 'c' || savedFormat === 'bin' || savedFormat === 'ascii') selectedFormat = savedFormat;
  matrix = createArray(savedHeight, savedWidth);
  updateTable();
  initOptions();
  updateCode();
});

function updateTable() {
	var width = matrix[0].length;
	var height = matrix.length;

	$('#_grid').html('');
	$('#_grid').append(populateTable(null, height, width, ""));

	// events
	$table.on("mousedown", "td", function(e){ toggle.call(this, e); updateCode(); });
    $table.on("mouseenter", "td", function(e){ toggle.call(this, e); if (e.buttons) updateCode(); });
    $table.on("dragstart", function() { return false; });
}

function initOptions() {
	$('#clearButton').click(function() { matrix = createArray(matrix.length,matrix[0].length); updateTable(); updateSummary(); updateCode(); });

	$('#copyButton').click(function() {
		var text = $('#_output').text();
		if (!text) return;
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(text).catch(function(){});
			return;
		}
		var ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.left = '-9999px';
		document.body.appendChild(ta);
		ta.focus();
		ta.select();
		try { document.execCommand('copy'); } catch (e) {}
		document.body.removeChild(ta);
	});

	 $('#widthDropDiv li a').click(function () {
	 	var width = parseInt($(this).html());
	 	var height = matrix.length;
       matrix = createArray(height, width);
       updateTable();
       updateSummary();
       updateCode();
       try { localStorage.setItem('dm_width', width); } catch (e) {}
    });

    $('#heightDropDiv li a').click(function () {
	 	var width = matrix[0].length;
	 	var height = parseInt($(this).html());
       matrix = createArray(height, width);
       updateTable();
       updateSummary();
       updateCode();
       try { localStorage.setItem('dm_height', height); } catch (e) {}
    });

    $('#byteDropDiv li a').click(function () {
	 	var selection = $(this).html();
       rowMajor = selection.startsWith("Row");  
       updateSummary();      
       updateCode();
       try { localStorage.setItem('dm_rowMajor', rowMajor ? '1' : '0'); } catch (e) {}
    });

    $('#endianDropDiv li a').click(function () {
	 	var selection = $(this).html();
       msbendian = selection.startsWith("Big");  
       updateSummary();      
       updateCode();
       try { localStorage.setItem('dm_msbendian', msbendian ? '1' : '0'); } catch (e) {}
    });

	// Output format buttons
	$('.format-btn').click(function () {
		selectedFormat = $(this).data('format');
		$('.format-btn').removeClass('active');
		$(this).addClass('active');
		try { localStorage.setItem('dm_format', selectedFormat); } catch (e) {}
		updateCode();
	});

	// Initialize active state from saved format
	$('.format-btn').removeClass('active');
	$('.format-btn[data-format="' + selectedFormat + '"]').addClass('active');

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
	$('#outputPanel').show();
	var output;
	if (selectedFormat === 'ascii') {
		output = generateAsciiArt();
		$('#_output').removeClass('lang-c prettyprinted');
		$('#_output').text(output);
		return;
	}

	var bytes = buildBytes();
	if (selectedFormat === 'bin') {
		output = "static const uint8_t data[] =\n{\n" + formatBinary(bytes) + "\n};";
	} else {
		output = "static const uint8_t data[] =\n{\n" + formatHex(bytes) + "\n};";
	}
	$('#_output').addClass('lang-c').removeClass('prettyprinted');

	// Prefer generating highlighted HTML directly for reliable live updates
	if (window.PR && typeof window.PR.prettyPrintOne === 'function') {
		$('#_output').html(window.PR.prettyPrintOne(output, 'c'));
	} else if (typeof window.prettyPrintOne === 'function') {
		$('#_output').html(window.prettyPrintOne(output, 'c'));
	} else {
		// Fallback to plain text and a best-effort prettyPrint scan
		$('#_output').text(output);
		var el = document.getElementById('_output');
		if (window.PR && typeof window.PR.prettyPrint === 'function') {
			window.PR.prettyPrint(null, el);
		} else if (typeof window.prettyPrint === 'function') {
			window.prettyPrint();
		}
	}
}

function buildBytes() {
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
				var page = Math.floor(y / 8);
				var bit = y % 8;
				buffer[(page * width + x) * 8 + bit] = temp;
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


	return bytes;
}

function formatHex(bytes) {
	var hexStrings = bytes.map(function (x) {
	    var hx = x.toString(16);
	    if (hx.length < 2) hx = '0' + hx;
	    return '0x' + hx;
	});
	var perLine = 12;
	var lines = [];
	for (var k = 0; k < hexStrings.length; k += perLine) {
		lines.push('    ' + hexStrings.slice(k, k + perLine).join(', '));
	}
	return lines.join(',\n');
}

function formatBinary(bytes) {
	var binStrings = bytes.map(function (x) {
		var b = x.toString(2);
		if (b.length < 8) b = Array(9 - b.length).join('0') + b;
		return '0b' + b;
	});
	var perLine = 12;
	var lines = [];
	for (var k = 0; k < binStrings.length; k += perLine) {
		lines.push('    ' + binStrings.slice(k, k + perLine).join(', '));
	}
	return lines.join(',\n');
}

function generateAsciiArt() {
	var width = matrix[0].length;
	var height = matrix.length;
	var lines = [];
	for (var y = 0; y < height; y++) {
		var row = '';
		for (var x = 0; x < width; x++) {
			row += matrix[y][x] ? '#' : '.';
		}
		lines.push(row);
	}
	return lines.join('\n');
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