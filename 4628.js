$.extend(String.prototype, {
  contains: function(word) {
    return this.indexOf(word) !== -1;
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
          return new Date(this.year, m, date);
        },
        dateString: function(date) {
          var d = this.withDate(date);
          return (d.getMonth() + 1) + '/' + d.getDate();
        }
      };
    })();
    
    var now = new Date().getTime();
    
    // テーブルの各行をチェック。
    $(this).each(function() {
      var values = $(this).find('td').map(function() {
        return $(this).text().trim();
      }).get();
      // テーブルの各セルの値。
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
      // 今日以降はチェックしない。
      if (now < current.withDate(date).getTime()) return;
      // 振休以外の休日はチェックしない。
      if (calendar.match(/休日/) && notification !== '休日出勤') return;
      if (notification.match(/(休暇|有休|計画年休)/)) return;
      
      // 出社時刻と退社時刻が打刻されていなければ、警告。
      if (!status.match(/(直行|出張)/) && arrival === null) {
        $(this).find('td:nth-child(7)').alert();
      }
      if (!status.match(/(直帰|出張)/) && departure === null) {
        $(this).find('td:nth-child(8)').alert();
      }
      
      if (check === '1') {
        // 備考欄に書く理由をリストアップ。
        var reasons = [];
        if (status.contains('直行')) reasons.push('直行');
        if (status.contains('直帰')) reasons.push('直帰');
        if (status.contains('出張')) reasons.push('出張');
        
        if (notification.contains('休日出勤')) {
          reasons.push('休日出勤');
        } else if (notification.contains('振休')) {
          reasons.push('振休');
        } else {
          // 出社時刻を確認。
          if (notification === '午前半休') {
            if (arrival !== null && arrival > 13 * 60 + 30) reasons.push('午前半休で遅刻');
          } else {
            if (arrival !== null && arrival > 9 * 60) reasons.push('遅刻');
          }
          // 退社時刻を確認。
          if (notification === '午後半休') {
            if (departure !== null && departure < 12 * 60 + 45) reasons.push('午後半休で早退');
          } else {
            if (departure !== null && departure < 17 * 60 + 15) reasons.push('早退');
            if (departure !== null && departure > 17 * 60 + 30) reasons.push('居残り');
          }
        }
        
        // 備考欄をチェック。警告を表示。
        if (comment === '' || comment.split('、').length < reasons.length) {
          var message = reasons.join(', ');
          console.log(current.dateString(date) + ': 「' + message + '」が必要ですが「' + comment + '」でした。');
          var $message = $('<span />').text(message).css({ backgroundColor: '#fff', padding: '0 10px' });
          $(this).find('td:nth-child(18)').alert().append($message);
        }
      }
    });
  },
  // セルを赤くして警告。
  alert: function() {
    return $(this).css({ backgroundColor: '#f33' });
  }
});

$('#submit_form0 > table.txt_12 > tbody').children('.bgcolor_white, .bgcolor_yasumi_blue, .bgcolor_yasumi_red').checkWork();
