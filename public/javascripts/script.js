$(function () {
  $('input[type="reset"]').on('click', function () {
    $(this).closest('.position').find('input[type="checkbox"]').prop('checked', false).removeAttr('checked');
    // return false;
  })
  var select = document.querySelector("select")
  console.log(select)
  var size = select['selected'];
  console.log(size)
  var options = document.querySelector("option[value=" + size + "]")
  console.log(options);
})