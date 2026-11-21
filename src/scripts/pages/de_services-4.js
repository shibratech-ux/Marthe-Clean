
        function get_PriceData() {

            var book_id = $('.service').data('book');
            var hours = $('.service').val();


            $.ajax({
                type: 'POST',
                crossDomain: true,
                url: 'https://marthacleanbesia.ch/pview/get_price_details',
                data: {
                    book_id: book_id, hours: hours

                },
                dataType: 'json',
                success: function (data) {
                    // alert(data.price);
                    if (data.status == 1) {



                        $('#price').val(data.total_price);



                    }

                }
            });
        }


        $("#Book_Register").submit(function (event) {

            event.preventDefault();
            var err = 0;

            var name = $('.name').val();
            var email = $('.email').val();
            var mobile = $(".mobile").val();
            var location = $(".location").val();
            var rooms = $(".rooms").val();
            var address = $(".address").val();

            if (name.trim() != "") {
                $(".name").removeClass('err');
            } else {
                $(".name").addClass('err');
                err++;
            }



            if (rooms.trim() != "") {
                $(".rooms").removeClass('err');
            } else {
                $(".rooms").addClass('err');
                err++;
            }




            if (address.trim() != "") {
                $(".address").removeClass('err');
            } else {
                $(".address").addClass('err');
                err++;
            }

            if (email.trim() != "") {
                $(".email").removeClass('err');
            } else {
                $(".email").addClass('err');
                err++;
            }

            if (mobile.trim() != "") {
                $(".mobile").removeClass('err');
            } else {
                $(".mobile").addClass('err');
                err++;
            }

            if (location.trim() != "") {
                $(".location").removeClass('err');
            } else {
                $(".location").addClass('err');
                err++;
            }





            if (err == 0) {


                $('.reg-btn').prop('disabled', true);
                $('.reg-btn').html('Registering...');
                $.ajax({
                    type: 'POST',
                    crossDomain: true,
                    url: 'https://marthacleanbesia.ch/pview/book_service',
                    method: "POST",
                    data: new FormData(this),
                    contentType: false,
                    cache: false,
                    processData: false,
                    dataType: "json",
                    success: function (data) {

                        if (data.login_status == "Success") {

                            alert('Registered Successfully, we will get back to you soon');

                            const destination = new URL(data.redirect_url, window.location.href);
                   if (destination.origin !== window.location.origin) throw new Error("Invalid redirect origin");
                   window.location.assign(destination.href);

                        }
                        else if (data.login_status == "Error") {
                            alert('Something went Worng,pls try again later');
                            $('.reg-btn').prop('disabled', false);
                            $('.reg-btn').html('Submit');
                        }



                    }
                });
            }
            else {
                alert('Please fill required details');
            }

        });


        $('.custom-input').keyup(function () {

            if ($(this).val()) {
                $(this).removeClass('err');
            }

        });

    
