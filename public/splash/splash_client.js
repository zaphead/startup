window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.pageYOffset > 0) {
      header.style.width = '100%';
      header.style.margin = '0px';
      header.style.borderRadius = '0px';
      header.style.border = "0px solid #ddd";
      header.style.borderBottom = "6px solid #ddd";
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
      header.style.backdropFilter = 'blur(15px)'
    } else {
      header.style.margin ='25px';
      header.style.width = 'calc(100% - 50px)';
      header.style.borderRadius = '25px';
      header.style.border = "1px solid #ddd";
      header.style.backgroundColor = 'white'
    }
  });