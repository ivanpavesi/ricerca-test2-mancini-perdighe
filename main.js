/**
 * Questionario APC - Script principale ottimizzato e compatibile
 * Gestisce la validazione, campi condizionali e invio del form
 * Versione ottimizzata per massima compatibilità con browser datati
 */

document.addEventListener('DOMContentLoaded', function() {
  // Inizializzazione componenti
  populateYears();
  setupConditionalFields();
  setupValidation();
  
  // Gestione submit form
  const form = document.getElementById('questionnaireForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
});

/**
 * Popola dinamicamente la select degli anni di specializzazione
 */
function populateYears() {
  const yearSelect = document.getElementById('dati_anno_specializzazione');
  if (!yearSelect) return;
  
  const currentYear = new Date().getFullYear();
  const startYear = 1992;
  
  // Crea frammento per ottimizzare performance
  const fragment = document.createDocumentFragment();
  for (let year = currentYear; year >= startYear; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    fragment.appendChild(option);
  }
  
  yearSelect.appendChild(fragment);
}

/**
 * Configura tutti i campi condizionali con gestori eventi unificati
 */
function setupConditionalFields() {
  // Nascondi tutti i campi condizionali all'inizio
  var conditionalFields = document.getElementsByClassName('conditional-field');
  for (var i = 0; i < conditionalFields.length; i++) {
    conditionalFields[i].style.display = 'none';
  }
  
  // Imposta i listener per tutti i controlli che influenzano i campi condizionali
  var radios = document.querySelectorAll('input[type="radio"]');
  for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', updateConditionalFields);
  }
  
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', updateConditionalFields);
  }
  
  // Esegui subito per impostare correttamente lo stato iniziale
  updateConditionalFields();
}

/**
 * Aggiorna la visibilità di tutti i campi condizionali in base alle selezioni correnti
 * Versione ottimizzata per compatibilità con browser datati
 */
function updateConditionalFields() {
  // Gestione campi toggle semplici (data-toggle)
  var toggles = document.querySelectorAll('[data-toggle]');
  for (var i = 0; i < toggles.length; i++) {
    var el = toggles[i];
    var targetId = el.getAttribute('data-toggle');
    var toggleValue = el.getAttribute('data-toggle-value') || el.value;
    var target = document.getElementById(targetId);
    
    if (target) {
      var shouldShow = el.checked && el.value === toggleValue;
      target.style.display = shouldShow ? 'block' : 'none';
      updateRequiredAttributes(target, shouldShow);
    }
  }
  
  // Gestione campi toggle multipli (data-toggle-multiple)
  var multiToggles = document.querySelectorAll('[data-toggle-multiple]');
  for (var j = 0; j < multiToggles.length; j++) {
    var el = multiToggles[j];
    var toggleConfig = el.getAttribute('data-toggle-multiple');
    
    if (toggleConfig) {
      var configs = toggleConfig.split(',');
      for (var k = 0; k < configs.length; k++) {
        var config = configs[k];
        var parts = config.split(':');
        var targetId = parts[0];
        var toggleValue = parts[1];
        var target = document.getElementById(targetId);
        
        if (target) {
          var shouldShow = el.checked && el.value === toggleValue;
          target.style.display = shouldShow ? 'block' : 'none';
          updateRequiredAttributes(target, shouldShow);
        }
      }
    }
  }
  
  // Gestione campi toggle con range (data-toggle-range)
  var rangeToggles = document.querySelectorAll('[data-toggle-range]');
  for (var l = 0; l < rangeToggles.length; l++) {
    var el = rangeToggles[l];
    if (el.checked) {
      var rangeConfig = el.getAttribute('data-toggle-range');
      var parts = rangeConfig.split(':');
      var targetId = parts[0];
      var minValue = parseInt(parts[1]);
      var maxValue = parseInt(parts[2]);
      var target = document.getElementById(targetId);
      
      if (target) {
        var value = parseInt(el.value);
        var shouldShow = value >= minValue && value <= maxValue;
        target.style.display = shouldShow ? 'block' : 'none';
        updateRequiredAttributes(target, shouldShow);
      }
    }
  }
}

/**
 * Aggiorna gli attributi required dei campi in base alla visibilità del container
 * Versione compatibile con browser datati
 */
function updateRequiredAttributes(container, isVisible) {
  if (!container) return;
  
  // Trova tutti i campi nel container
  var inputs = container.querySelectorAll('input');
  var selects = container.querySelectorAll('select');
  var textareas = container.querySelectorAll('textarea');
  
  // Funzione helper per gestire ciascun campo
  function handleField(field) {
    if (field.type === 'radio') {
      // Gestione speciale per radio button (imposta required solo sul primo)
      var name = field.name;
      var radios = document.querySelectorAll('input[type="radio"][name="' + name + '"]');
      
      if (radios.length > 0) {
        if (isVisible) {
          // Cerca una label con classe required relativa a questo gruppo
          var fieldGroup = findParentWithClass(field, 'form-group');
          var isRequired = false;
          
          if (fieldGroup) {
            var labels = fieldGroup.getElementsByTagName('label');
            for (var i = 0; i < labels.length; i++) {
              if (labels[i].classList.contains('required')) {
                isRequired = true;
                break;
              }
            }
          }
          
          if (isRequired) {
            radios[0].setAttribute('required', '');
          }
        } else {
          for (var j = 0; j < radios.length; j++) {
            radios[j].removeAttribute('required');
          }
        }
      }
    } else {
      // Per tutti gli altri tipi di campi
      if (isVisible) {
        // Verifica se questo campo dovrebbe essere obbligatorio
        var isRequired = false;
        var id = field.id;
        
        if (id) {
          // Cerca label tramite for=id
          var labels = document.querySelectorAll('label[for="' + id + '"]');
          for (var i = 0; i < labels.length; i++) {
            if (labels[i].classList.contains('required')) {
              isRequired = true;
              break;
            }
          }
        }
        
        // Cerca anche nel gruppo contenitore
        if (!isRequired) {
          var fieldGroup = findParentWithClass(field, 'form-group');
          if (fieldGroup) {
            var groupLabels = fieldGroup.getElementsByTagName('label');
            for (var j = 0; j < groupLabels.length; j++) {
              if (groupLabels[j].classList.contains('required')) {
                isRequired = true;
                break;
              }
            }
          }
        }
        
        if (isRequired) {
          field.setAttribute('required', '');
        }
      } else {
        field.removeAttribute('required');
      }
    }
  }
  
  // Applica a tutti i tipi di campi
  for (var i = 0; i < inputs.length; i++) {
    handleField(inputs[i]);
  }
  
  for (var j = 0; j < selects.length; j++) {
    handleField(selects[j]);
  }
  
  for (var k = 0; k < textareas.length; k++) {
    handleField(textareas[k]);
  }
}

/**
 * Trova il primo genitore con una certa classe
 * Funzione helper compatibile con browser datati
 */
function findParentWithClass(element, className) {
  var parent = element.parentNode;
  while (parent) {
    if (parent.classList && parent.classList.contains(className)) {
      return parent;
    }
    parent = parent.parentNode;
  }
  return null;
}

/**
 * Configura la gestione della validazione dei campi
 */
function setupValidation() {
  // Aggiungi listener per pulire gli errori quando i campi vengono modificati
  var fields = document.querySelectorAll('input, select, textarea');
  for (var i = 0; i < fields.length; i++) {
    fields[i].addEventListener('input', function() {
      hideError(this.id);
      this.classList.remove('error');
    });
  }
}

/**
 * Gestisce l'invio del form con validazione
 */
function handleFormSubmit(event) {
  event.preventDefault();
  
  // Feedback visivo iniziale
  var submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifica dati...';
  
  // Crea/aggiorna elemento feedback
  var feedbackElement = document.getElementById('submitFeedback');
  if (!feedbackElement) {
    feedbackElement = document.createElement('div');
    feedbackElement.id = 'submitFeedback';
    submitBtn.parentNode.appendChild(feedbackElement);
  }
  feedbackElement.textContent = 'Verifica dati in corso...';
  feedbackElement.style.backgroundColor = '#f8f9fa';
  feedbackElement.style.borderColor = '#ddd';
  feedbackElement.style.display = 'block';
  
  // Piccolo ritardo per assicurare che il feedback sia visibile
  setTimeout(function() {
    // Validazione form
    if (!validateForm()) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Invia Questionario';
      feedbackElement.textContent = 'Correggi gli errori evidenziati prima di inviare.';
      feedbackElement.style.backgroundColor = '#f8d7da';
      feedbackElement.style.borderColor = '#f5c6cb';
      
      // Scorri fino al primo errore
      scrollToFirstError();
      return;
    }
    
    // Aggiorna feedback prima dell'invio
    feedbackElement.textContent = 'Dati validi. Invio in corso...';
    submitBtn.textContent = 'Invio in corso...';
    
    // Preparazione e invio dei dati
    var formData = prepareFormData();
    sendToGoogleSheets(formData);
  }, 200);
}

/**
 * Valida il form completo
 * @returns {boolean} - true se la validazione passa, false altrimenti
 */
function validateForm() {
  var isValid = true;
  
  // Cancella tutti i messaggi di errore precedenti
  var errorMessages = document.querySelectorAll('.error-message');
  for (var i = 0; i < errorMessages.length; i++) {
    errorMessages[i].style.display = 'none';
  }
  
  var errorFields = document.querySelectorAll('.error');
  for (var j = 0; j < errorFields.length; j++) {
    errorFields[j].classList.remove('error');
  }
  
  // Funzione per verificare se un elemento è visibile nel DOM
  function isElementVisible(el) {
    if (!el) return false;
    var parent = el;
    while (parent && parent !== document) {
      var style = window.getComputedStyle(parent);
      if (style.display === 'none') return false;
      parent = parent.parentElement;
    }
    return true;
  }
  
  // Validazione dei campi input, select e textarea obbligatori
  var requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
  for (var k = 0; k < requiredInputs.length; k++) {
    var input = requiredInputs[k];
    if (isElementVisible(input) && !input.value) {
      showError(input.id || input.name);
      isValid = false;
    }
  }
  
  // Validazione dei radio button obbligatori
  var radioGroups = new Set();
  var requiredRadios = document.querySelectorAll('input[type="radio"][required]');
  
  for (var l = 0; l < requiredRadios.length; l++) {
    var radio = requiredRadios[l];
    if (isElementVisible(radio)) {
      radioGroups.add(radio.name);
    }
  }
  
  // Converte Set in Array per compatibilità
  var radioGroupsArray = Array.from(radioGroups);
  for (var m = 0; m < radioGroupsArray.length; m++) {
    var name = radioGroupsArray[m];
    var isChecked = document.querySelector('input[name="' + name + '"]:checked');
    if (!isChecked) {
      showError(name);
      isValid = false;
    }
  }
  
  // Validazione dei checkbox con vincoli di selezione
  var checkboxGroups = document.querySelectorAll('.checkbox-group');
  for (var n = 0; n < checkboxGroups.length; n++) {
    var group = checkboxGroups[n];
    if (!isElementVisible(group)) continue;
    
    // Verifica "almeno uno richiesto"
    var requiredCheckboxes = group.querySelectorAll('.at-least-one-required');
    if (requiredCheckboxes.length > 0) {
      var fieldName = requiredCheckboxes[0].name;
      var checkedCount = 0;
      
      for (var o = 0; o < requiredCheckboxes.length; o++) {
        if (requiredCheckboxes[o].checked) {
          checkedCount++;
        }
      }
      
      if (checkedCount === 0) {
        showError(fieldName);
        isValid = false;
      }
    }
    
    // Verifica "massimo tre richiesti"
    var maxThreeCheckboxes = group.querySelectorAll('.max-three-required');
    if (maxThreeCheckboxes.length > 0) {
      var fieldName = maxThreeCheckboxes[0].name;
      var checkedCount = 0;
      
      for (var p = 0; p < maxThreeCheckboxes.length; p++) {
        if (maxThreeCheckboxes[p].checked) {
          checkedCount++;
        }
      }
      
      if (checkedCount > 3) {
        showError(fieldName);
        isValid = false;
      }
    }
  }
  
  return isValid;
}

/**
 * Mostra il messaggio di errore per un campo
 */
function showError(fieldId) {
  // Cerca l'elemento errore sia per id che per name (per radio e checkbox)
  var errorElement = document.getElementById(fieldId + '-error');
  if (errorElement) {
    errorElement.style.display = 'block';
    
    // Evidenzia il campo con l'errore
    var field = document.getElementById(fieldId) || document.querySelector('[name="' + fieldId + '"]');
    if (field) {
      field.classList.add('error');
    }
  }
}

/**
 * Nasconde il messaggio di errore per un campo
 */
function hideError(fieldId) {
  var errorElement = document.getElementById(fieldId + '-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

/**
 * Scorre fino al primo errore visualizzato
 */
function scrollToFirstError() {
  var firstError = document.querySelector('.error-message[style="display: block;"]');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Prepara i dati del form per l'invio
 * @returns {Object} - Dati del form pronti per l'invio
 */
function prepareFormData() {
  var form = document.getElementById('questionnaireForm');
  var formData = new FormData(form);
  var formDataObj = {};
  
  // Gestione speciale per checkbox (valori multipli)
  var formEntries = formData.entries();
  var entry;
  
  while (!(entry = formEntries.next()).done) {
    var key = entry.value[0];
    var value = entry.value[1];
    
    if (formDataObj[key]) {
      if (!Array.isArray(formDataObj[key])) {
        formDataObj[key] = [formDataObj[key]];
      }
      formDataObj[key].push(value);
    } else {
      formDataObj[key] = value;
    }
  }
  
  // Converti array in stringhe CSV
  for (var key in formDataObj) {
    if (Array.isArray(formDataObj[key])) {
      formDataObj[key] = formDataObj[key].join(', ');
    }
  }
  
  return formDataObj;
}

/**
 * Invia dati a Google Sheets
 * @param {Object} data - Dati del form da inviare
 */
function sendToGoogleSheets(data) {
  // URL dello script Google Apps Script
  var scriptURL = 'https://script.google.com/macros/s/AKfycbwnG8nkLg_oSY2iSVUgfljFmPlQku1W58rHHZaKFYuISK3HIC48uvGEKDiSmFDFGOudmw/exec';
  
  // Aggiorna UI per feedback
  var submitBtn = document.getElementById('submitBtn');
  submitBtn.textContent = 'Invio in corso...';
  
  // Aggiorna feedback
  var feedbackElement = document.getElementById('submitFeedback');
  if (feedbackElement) {
    feedbackElement.textContent = 'Invio in corso... Attendere prego.';
  }
  
  // Prepara dati per l'invio in formato URL encoded
  var params = new URLSearchParams();
  
  // Aggiungi tutti i campi
  for (var key in data) {
    params.append(key, data[key]);
  }
  
  // Inizializza XMLHttpRequest (per compatibilità con browser più datati)
  var xhr = new XMLHttpRequest();
  var timeoutId;
  
  // Gestione timeout
  timeoutId = setTimeout(function() {
    xhr.abort();
    handleRequestError({ name: 'TimeoutError', message: 'Request timed out' });
  }, 30000);
  
  // Gestione errore
  function handleRequestError(error) {
    console.error('Errore:', error);
    
    // Personalizza messaggio di errore
    var errorMessage = 'Errore durante l\'invio. ';
    
    if (error.name === 'TimeoutError') {
      errorMessage += 'La richiesta è scaduta. Verifica la tua connessione e riprova.';
    } else if (error.message && error.message.includes('Failed to fetch')) {
      errorMessage += 'Problema di connessione. Verifica la tua connessione internet e riprova.';
    } else {
      errorMessage += 'Riprova più tardi o contatta l\'amministratore.';
    }
    
    // Aggiorna feedback in caso di errore
    if (feedbackElement) {
      feedbackElement.textContent = errorMessage;
      feedbackElement.style.backgroundColor = '#f8d7da';
      feedbackElement.style.borderColor = '#f5c6cb';
    }
    
    // Riabilita pulsante di invio
    submitBtn.disabled = false;
    submitBtn.textContent = 'Riprova';
    
    clearTimeout(timeoutId);
  }
  
  // Configura e invia la richiesta
  xhr.open('POST', scriptURL, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  
  xhr.onload = function() {
    clearTimeout(timeoutId);
    
    if (xhr.status >= 200 && xhr.status < 300) {
      // Successo
      // Mostra messaggio di ringraziamento
      var thankYouMessage = document.getElementById('thankYouMessage');
      if (thankYouMessage) {
        thankYouMessage.style.display = 'block';
        thankYouMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Nascondi form dopo breve ritardo
      setTimeout(function() {
        // Nascondi tutto tranne il messaggio di ringraziamento
        var formChildren = document.getElementById('questionnaireForm').children;
        for (var i = 0; i < formChildren.length; i++) {
          if (formChildren[i].id !== 'thankYouMessage') {
            formChildren[i].style.display = 'none';
          }
        }
      }, 1000);
      
      // Aggiorna feedback
      if (feedbackElement) {
        feedbackElement.textContent = 'Invio completato con successo!';
        feedbackElement.style.backgroundColor = '#d4edda';
        feedbackElement.style.borderColor = '#c3e6cb';
      }
    } else {
      // Errore di risposta
      handleRequestError(new Error('Errore nella risposta del server'));
    }
  };
  
  xhr.onerror = function() {
    clearTimeout(timeoutId);
    handleRequestError(new Error('Failed to fetch'));
  };
  
  // Invia la richiesta
  xhr.send(params.toString());
}
