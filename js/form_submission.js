$(document).ready(function () {

    $('#notifs-form-btn').click(function (e) {
        var name = $('#notifs-form-name').val();
        var phone = $('#notifs-form-phone').val();

        if (name && phone) {
            var data = {
                name: name,
                phone: phone
            };

            $.ajax({
                url: 'https://flows.soul23.cloud/webhook/Ul6upjlKqQQ79rDgd8XKOm',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function (response) {
                    console.log("Webhook sent successfully", response);
                    $("#notifs-form-btn").text("gracias :)");
                    $("#notifs-form-btn").prop("disabled", true);
                    alert("¡Gracias! Hemos recibido tus datos.");
                },
                error: function (xhr, status, error) {
                    console.error("Error sending webhook", error);
                    var errorMessage = "Hubo un error al enviar tus datos.";
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage += "\n" + xhr.responseJSON.message;
                    } else if (xhr.responseText) {
                        errorMessage += "\n" + xhr.responseText;
                    }
                    alert(errorMessage);
                }
            });
        } else {
            alert('jejeje, lo haremos mas fácil en el futuro');
        }
    });

});