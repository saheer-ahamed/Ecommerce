// const { response } = require("../../app");
// const { notify } = require("../../routes/users");



function addToCart(proId, quantity, sellprice) {

    $.ajax({
        url: '/addToCart/' + proId + '/' + quantity + '/' + sellprice,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cartCount').attr("data-notify")
                // count = parseInt(count) + 1
                $('#cartCount').attr("data-notify", count)
                location.href = "/cart";
            }
        }
    })
    // }
}

function myFunction(productId, sellprice) {
    var itemQuantity = document.getElementById("quantityValue").value;
    itemQuantity = parseInt(itemQuantity)
    sellprice = parseInt(sellprice)
    addToCart(productId, itemQuantity, sellprice)
}

function addToWishlist(proId) {

    $.ajax({
        url: '/addToWishlist/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                console.log(response.status)
            }
        }
    })
}

// function removeCartItem(proId) {
//     $.ajax({
//         url: '/removeCartItem/' + proId,
//         method: 'get',
//         success: (response) => {
//             if (response.status) console.log(response)
//         }
//     })
// }

function chosenAddress(addressId) {
    $.ajax({
        url: '/chosenAddress/' + addressId,
        method: 'get',
        success: (response) => {
            document.getElementById('fullName').value = response.fullName;
            document.getElementById('apartment').value = response.apartment;
            document.getElementById('street').value = response.street;
            document.getElementById('landmark').value = response.landmark;
            document.getElementById('mobile').value = response.mobile;
            document.getElementById('country').value = response.country;
            document.getElementById('state').value = response.state;
            document.getElementById('pincode').value = response.pincode;
        }
    })
}

function deleteAddress(addressId) {
    $.ajax({
        url: '/deleteAddress/' + addressId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                location.reload()
            }
        }
    })
}

$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/placed-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            if (response.status) {
                razorpayPayment(response)
            } else {
                location.href = '/orderSuccess';
            }
        }
    })
})

function razorpayPayment(orderData) {

    var options = {
        "key": 'rzp_test_jI5rdaXsXAxGvp', // Enter the Key ID generated from the Dashboard
        "amount": orderData.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "PRYINGCHESS",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": "" + orderData.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": async function (response) {

            verifyPayment(response, orderData);
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment, orderData) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment, orderData
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.href = '/orderSuccess'
            } else {
                alert("Payment Failed")
            }
        }
    })
}

function applyCoupon() {
    var couponValue = $('#couponCode').val()
    $.ajax({
        url: '/applyCoupon',
        data:
        {
            couponCode: couponValue
        },
        method: 'post',
        success: (response) => {
            if (response.discount) {
                $('#discountField').text(`₹ ${response.discount}`);
                var mainTotal = $('#SubTotal').text() - response.discount
                $('#Total').text(`${mainTotal}`)
            }
            if (!response.status && response.noMinPurchase) {
                alert(`Minimum Purchase amount is ₹ ${response.minPurchaseAmount}`)
            }
            if (!response.status && response.couponUsed) {
                alert('Coupon is not Valid')
            }
        }
    })
}

function deleteCoupon(couponId) {
    $.ajax({
        url: '/admin/deleteCoupon/' + couponId,
        method: 'get',
        success: (response) => {
            $('#couponTable').load(location.href + ' #couponTable')
        }
    })
}

function deleteBanner(bannerId) {
    const confirmation = confirm('Are you sure about delete this banner?');
    if (confirmation) {
        $.ajax({
            url: '/admin/deleteBanner/' + bannerId,
            method: 'get',
            success: (response) => {
                if (response.status) {
                    $('#bannerTable').load(location.href + ' #bannerTable')
                }
            }
        })
    }
}

function deleteProduct(productId) {
    const confirmation = confirm('Are you sure about delete this Product?');
    if (confirmation) {
        $.ajax({
            url: '/admin/deleteProduct/' + productId,
            method: 'get',
            success: (response) => {
                if (response.status) {
                    $('#productsTable').load(location.href + ' #productsTable')
                }
            }
        })
    }
}