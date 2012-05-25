$.extend(String.prototype, {
  contains: function(word) {
    return this.indexOf(word) !== -1;
  },
  trim: function() {
    var nbsp = String.fromCharCode(160);
    return this.replace(nbsp, '');
  },
  minutes: function() {
    var values = this.split(':');
    if (values.length !== 2) {
      return null;
    }
    return parseInt(values[0], 10) * 60 + parseInt(values[1], 10);
  }
});

$.fn.extend({
  checkWork: function() {
    var current = (function() {
      var dateString = $('tr#span0 > td:nth-child(6)').text(),
          dateNums = /(\d{4})年(\d{2})月(\d{2})日/.exec(dateString);
      return {
        year: parseInt(dateNums[1], 10),
        month: parseInt(dateNums[2], 10),
        withDate: function(date) {
          var m = this.month - 1;
          if (date <= 20) m++;
          return new Date(this.year, m, date).getTime();
        }
      };
    })();
    
    var now = new Date().getTime();
    
    $(this).each(function() {
      var values = $(this).find('td').map(function() {
        return $(this).text().trim();
      }).get();
      var date = values[0],
          day = values[1],
          calendar = values[2],
          notification = values[4],
          status = values[5],
          arrival = values[6].minutes(),
          departure = values[7].minutes(),
          work = values[8].minutes(),
          rest = values[9].minutes(),
          overtime = values[10].minutes(),
          midnight = values[11].minutes(),
          check = values[16],
          comment = values[17];
      // Check if it's after today.
      if (now < current.withDate(date)) return;
      
      if (notification === '有休' || notification.contains('休暇')) return;
      
      if (!status.contains('直行') && arrival === null) {
        $(this).find('td:nth-child(7)').alert();
      }
      if (!status.contains('直帰') && departure === null) {
        $(this).find('td:nth-child(8)').alert();
      }
      
      if (check === '1') {
        var reasons = [];
        if (status.contains('直行')) reasons.push('直行');
        if (status.contains('直帰')) reasons.push('直行');
        if (notification === '午前半休') {
          // TODO Should we come by 1pm?
          if (arrival !== null && arrival > 13 * 60) reasons.push('午前半休で遅刻');
        } else {
          if (arrival !== null && arrival > 9 * 60) reasons.push('遅刻');
        }
        if (notification === '午後半休') {
          // TODO Can we go home at 12pm?
          if (departure !== null && departure < 12 * 60) reasons.push('午後半休で早退');
        } else {
          if (departure !== null && departure < 17 * 60 + 15) reasons.push('早退');
          if (departure !== null && departure > 17 * 60 + 30) reasons.push('居残り');
        }
        
        if (comment === '' || comment.split('、').length < reasons.length) {
          var message = reasons.join(', ');
          console.log(current.month + '/' + date + ': ' + message);
          var $message = $('<span />').text(message).css({ backgroundColor: '#fff', padding: '0 10px' });
          $(this).find('td:nth-child(18)').alert().append($message);
        }
      }
    });
  },
  alert: function() {
    return $(this).css({ backgroundColor: '#f33' });
  }
});

//$('#submit_form0 > table.txt_12').find('tbody > .bgcolor_white, tbody > .bgcolor_yasumi_blue, tbody > .bgcolor_yasumi_red').checkWork();
$('#submit_form0 > table.txt_12').find('tbody > .bgcolor_white').checkWork();
