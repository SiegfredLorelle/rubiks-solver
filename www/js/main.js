const contactForm = document.getElementById('contact-form'),
  contactName = document.getElementById('contact-name'),
  contactEmail = document.getElementById('contact-email'),
  contactSubject = document.getElementById('contact-subject'),
  contactMessage = document.getElementById('contact-message'),
  errorMessage = document.getElementById('error-message');

const sendEmail = (e) => {
  e.preventDefault();

  // check if the field has a value
  if (
    contactName.value === '' ||
    contactEmail.value === '' ||
    contactSubject.value === '' ||
    contactMessage.value === ''
  ) {
    // show message
    errorMessage.textContent = 'Write all the input fields';
  } else {
    // serviceID - templateID - #form - publickey
    emailjs
      .sendForm(
        'service_sda6v3o',
        'template_v51gr8c',
        '#contact-form',
        'o3tWIaBrjgDdAoT8d'
      )
      .then(
        () => {
          // show message and add color, window + dot to open emoji
          // it will just prompt a "Message Sent" text but it will not basically
          // be sent to my email because it needs to use use a server-side scripting language like PHP
          errorMessage.classList.add('color-first');
          errorMessage.textContent = 'Message sent ✔';

          // remove message after 5 seconds
          setTimeout(() => {
            errorMessage.textContent = '';
          }, 5000);
        },
        (error) => {
          alert('OOPs! SOMETHING WENT WRONG...', error);
        }
      );

    // clear input fields
    contactName.value = '';
    contactEmail.value = '';
    contactSubject.value = '';
    contactMessage.value = '';
  }
};

contactForm.addEventListener('submit', sendEmail);