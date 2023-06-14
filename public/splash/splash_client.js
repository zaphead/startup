window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.pageYOffset > 0) {
      header.style.width = '100%';
      header.style.margin = '0px';
      header.style.borderRadius = '0px';


    } else {
      header.style.margin ='25px';
      header.style.width = 'calc(100% - 50px)';
      header.style.borderRadius = '25px';


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





//SLIDESHOW 

let images = ["woman-checklist.png", "cook.png", "man-boxes.png", "man-on-phone.png", "man-sign.png", "realtor.png", "camera-guy.png" /* List all image names here... */];
let index = Math.floor(Math.random() * images.length);
let imgSlideshow = document.getElementById("imgSlideshow");

let lastImagesIndices = [index]; // initialize the queue with the first index

function changeImage() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * images.length);
    } while (lastImagesIndices.includes(newIndex));
    
    lastImagesIndices.push(newIndex); // add the new index to the queue
    if (lastImagesIndices.length > 3) {
        lastImagesIndices.shift(); // remove the oldest index if the queue is full
    }
    
    index = newIndex;
    imgSlideshow.src = "../Images/owners/" + images[index];
    imgSlideshow.style.opacity = 1;
}

setInterval(() => {
    imgSlideshow.style.opacity = 0;
    setTimeout(changeImage, 500); //500ms to match with the CSS transition duration
}, 3000); //3 seconds
