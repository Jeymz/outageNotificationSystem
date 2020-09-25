/* eslint-disable */
$(document).ready(function() {
  $('#levelSelect ').on('click', (item) => {
    $('#notificationHeaderText').html(`IT Alert: ${item.target.options[item.currentTarget.value - 1].text}`);
    $('#notificationType').html(item.target.options[item.currentTarget.value - 1].text)
  });

  $('#changeView').on('click', () => {
    if ($('#form').hasClass('col-lg-6')) {
      $('#form').removeClass('col-lg-6').addClass('col-lg-12');
      $('#preview').hide();
      $('#changeView').html('Show Preview');
    } else {
      $('#form').removeClass('col-lg-12').addClass('col-lg-6');
      $('#preview').show();
      $('#changeView').html('Hide Preview');
    }
  });
  $('#description').on('input', () => {
    $('#notificationDescription').html($('#description').val());
  });
  $('#action').on('input', () => {
    $('#notificationAction').html($('#action').val());
  });
  $('#update').on('input', () => {
    $('#notificationUpdate').html($('#update').val());
  });
  $('#serviceSelect').click(() => {
    $('#notificationServices').html('')
    const options = $('#serviceSelect').prop('options');
    const selection = $('#serviceSelect').val();
    let spacer = '';
    let count = 0;
    for (let i = 0; i < options.length; i += 1) {
      if (selection.includes(options[i].value)) {
        if (count > 0) {
          spacer = ','
        }
        $('#notificationServices').html(`${$('#notificationServices').html()}${spacer} ${options[i].text}`)
        count += 1
      }
    }
  });
  function updateTime() {
    const currentTime = new Date()
    $('#startTime').html(currentTime)
  }
  $('button[name="updateOutage"]').on('click', () => {

  });

  setInterval(updateTime, 1000)
});

function updateOutage(buttonID) {
  if ($('#currentOutages').hasClass('col-lg-6')) {
    $('#currentOutages').removeClass('col-lg-6').addClass('col-lg-12');
    $('#update').hide()
    $(`#${buttonID}`).html('Update');
  } else {
    $('#currentOutages').removeClass('col-lg-12').addClass('col-lg-6');
    $('#update').show();
    $(`#${buttonID}`).html('Cancel');
  }
}
