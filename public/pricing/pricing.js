window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.pageYOffset > 0) {
      header.style.width = '100%';
      header.style.margin = '0px';
      header.style.borderRadius = '0px';
      header.style.border = "0px solid #ddd";
      header.style.borderBottom = "6px solid #ddd";
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.85)'
      header.style.backdropFilter = 'blur(20px)'
    } else {
      header.style.margin ='25px';
      header.style.width = 'calc(100% - 50px)';
      header.style.borderRadius = '25px';
      header.style.border = "1px solid #ddd";
      header.style.backgroundColor = 'white';
    }
  });

  window.addEventListener('DOMContentLoaded', function() {
    var header = document.querySelector('header');
    var headerSpacer = document.querySelector('.header-spacer');
    headerSpacer.style.height = header.offsetHeight + 'px';
    console.log("header spaced yo")
  });

var app = {"textSwitcherTitles":["Startup","Side-Hustle","Non-Profit","Laboratory"]};
var $ = jQuery;

(function() {
/**
 * =============
 * Text Switcher
 * =============
 **/

if ('textSwitcherTitles' in app) {
var $textSwitcher = $('.text-switcher');
if ($textSwitcher.length) {
  var titles = app.textSwitcherTitles,
      startAfterTimeInterval = 1000;

  // push the current (start) text into the array
  titles.push($textSwitcher.text());

  $.fn.teletype = function(opts) {
    var $this = this,
        defaults = {
          delayBefore: 0,
          delayAfter: 0,
          delayInBetween: 100,
          removalDelay: 50,
          insertionDelay: 50,
          text: '',
          before: '',
          after: ''
        },
        settings = $.extend(defaults, opts),
        oldText = $this.text(),
        insertCharacter,
        removeCharacter = function(amount) {
          setTimeout(function() {
            $this.html(settings.before + oldText.slice(0, -amount) + settings.after);
            amount++;
            if (amount <= oldText.length) {
              removeCharacter(amount);
            } else {
              setTimeout(function() {
                insertCharacter(1);
              }, settings.delayInBetween);
            }
          }, settings.removalDelay);
        };

    insertCharacter = function(amount) {
      setTimeout(function() {
        $this.html(settings.before + settings.text.slice(0, amount) + settings.after);
        amount++;
        if (amount <= settings.text.length) {
          insertCharacter(amount);
        } else {
          if (typeof settings.callback === "function") {
            setTimeout(function() {
              settings.callback.apply($this.get(0));
            }, settings.delayAfter);
          }
        }
      }, settings.insertionDelay);
    };

    setTimeout(function() {
      removeCharacter(1);
    }, settings.delayBefore);
  };

  var counter = 0,
      switcher = function() {
        $textSwitcher.addClass('has-cursor');
        $textSwitcher.teletype({
          text: titles[counter++],
          delayBefore: 1000,
          delayAfter: 500,
          //after: '<span class="cursor">|</span>',
          callback: function() {
            $(this).removeClass('has-cursor');
            setTimeout(switcher, startAfterTimeInterval);
          }
        });

        if (counter >= titles.length) {
          counter = 0;
        }
      };

  $(window).on('load', function() {
    setTimeout(switcher, startAfterTimeInterval);
  });
}
}
})(); // Text Switcher



//Scrolling to anchors
document.getElementById("toSection2").addEventListener("click", function() {
  document.getElementById("section2").scrollIntoView({ behavior: 'smooth' });
});

document.getElementById("toSection3").addEventListener("click", function() {
  document.getElementById("section3").scrollIntoView({ behavior: 'smooth' });
});

document.getElementById("toSection4").addEventListener("click", function() {
  document.getElementById("section4").scrollIntoView({ behavior: 'smooth' });
});




//STRIPE CODE

// Replace 'your_test_publishable_key' with your actual Stripe test publishable key
const publishableKey = 'your_test_publishable_key';

// Create a new Stripe instance with the test key
const stripe = Stripe(publishableKey);

// Handle the form submission
const form = document.getElementById('checkout-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Disable the submit button to prevent multiple clicks
  form.querySelector('button').disabled = true;
  
  // Create a payment method using the Stripe card element
  const cardElement = elements.create('card');
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  });
  
  if (error) {
    // Handle any errors that occurred during payment method creation
    // Display an error message to the user
    console.error(error.message);
    form.querySelector('.error-message').textContent = error.message;
    
    // Re-enable the submit button
    form.querySelector('button').disabled = false;
  } else {
    // Payment method created successfully
    // Send the payment method ID to your server to create a payment intent or process the payment
    const paymentMethodId = paymentMethod.id;
    // Send the payment method ID to your server and handle the payment on the server side
    
    // Clear any previous error messages
    form.querySelector('.error-message').textContent = '';
    
    // Reset the form
    form.reset();
    
    // Re-enable the submit button
    form.querySelector('button').disabled = false;
  }
});
