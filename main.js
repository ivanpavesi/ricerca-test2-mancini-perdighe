/**
 * Questionario APC - Script principale ottimizzato
 * Gestisce la validazione, campi condizionali e invio del form
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
  // Imposta i listener per tutti i controlli che influenzano i campi condizionali
  document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', updateConditionalFields);
  });
  
  // Esegui subito per impostare correttamente lo stato iniziale
  updateConditionalFields();
}

/**
 * Aggiorna la visibilità di tutti i campi condizionali in base alle selezioni correnti
 */
/**
 * Aggiorna la visibilità di tutti i campi condizionali in base alle selezioni correnti
 */
function updateConditionalFields() {
  // Gestione campi toggle semplici (data-toggle)
  document.querySelectorAll('[data-toggle]').forEach(el => {
    const targetId = el.getAttribute('data-toggle');
    const toggleValue = el.getAttribute('data-toggle-value') || el.value;
    const target = document.getElementById(targetId);
    
    if (target) {
      const shouldShow = el.checked && el.value === toggleValue;
      target.style.display = shouldShow ? 'block' : 'none';
      updateRequiredAttributes(target, shouldShow);
    }
  });
  
  // Gestione campi toggle multipli (data-toggle-multiple)
  document.querySelectorAll('[data-toggle-multiple]').forEach(el => {
    const toggleConfig = el.getAttribute('data-toggle-multiple');
    if (toggleConfig) {
      toggleConfig.split(',').forEach(config => {
        const [targetId, toggleValue] = config.split(':');
        const target = document.getElementById(targetId);
        
        if (target) {
          const shouldShow = el.checked && el.value === toggleValue;
          target.style.display = shouldShow ? 'block' : 'none';
          updateRequiredAttributes(target, shouldShow);
        }
      });
    }
  });
  
  // Gestione campi toggle con range (data-toggle-range)
  document.querySelectorAll('[data-toggle-range]').forEach(el => {
    if (el.checked) {
      const [targetId, minValue, maxValue] = el.getAttribute('data-toggle-range').split(':');
      const target = document.getElementById(targetId);
      
      if (target) {
        const value = parseInt(el.value);
        const min = parseInt(minValue);
        const max = parseInt(maxValue);
        const shouldShow = value >= min && value <= max;
        
        target.style.display = shouldShow ? 'block' : 'none';
        updateRequiredAttributes(target, shouldShow);
      }
    }
  });
}

/**
 * Aggiorna gli attributi required dei campi in base alla visibilità del container
 */
function updateRequiredAttributes(container, isVisible) {
  if (!container) return;
  
  // Trova tutti i campi obbligatori nel container
  const requiredFields = container.querySelectorAll('input, select, textarea');
  
  requiredFields.forEach(field => {
    // Gestione speciale per radio button (imposta required solo sul primo)
    if (field.type === 'radio') {
      const radios = document.querySelectorAll(`input[type="radio"][name="${field.name}"]`);
      if (radios.length > 0) {
        if (isVisible) {
          radios[0].setAttribute('required', '');
        } else {
          radios.forEach(r => r.removeAttribute('required'));
        }
      }
    } else {
      if (isVisible) {
        // Controlla se il campo ha una label con classe "required"
        const fieldId = field.id;
        const labels = document.querySelectorAll(`label[for="${fieldId}"], label:has(input#${fieldId})`);
        
        let shouldBeRequired = false;
        labels.forEach(label => {
          if (label.classList.contains('required')) {
            shouldBeRequired = true;
          }
        });
        
        if (shouldBeRequired) {
          field.setAttribute('required', '');
        }
      } else {
        field.removeAttribute('required');
      }
    }
  });
}

/**
 * Configura la gestione della validazione dei campi
 */
function setupValidation() {
  // Aggiungi listener per pulire gli errori quando i campi vengono modificati
  document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', function() {
      hideError(this.id);
      this.classList.remove('error');
    });
  });
}

/**
 * Gestisce l'invio del form con validazione
 */
function handleFormSubmit(event) {
  event.preventDefault();
  
  // Feedback visivo iniziale
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifica dati...';
  
  // Crea/aggiorna elemento feedback
  let feedbackElement = document.getElementById('submitFeedback');
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
  setTimeout(() => {
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
    const formData = prepareFormData();
    sendToGoogleSheets(formData);
  }, 200);
}

/**
 * Valida il form completo
 * @returns {boolean} - true se la validazione passa, false altrimenti
 */
function validateForm() {
  let isValid = true;
  
  // Cancella tutti i messaggi di errore precedenti
  document.querySelectorAll('.error-message').forEach(errorMsg => {
    errorMsg.style.display = 'none';
  });
  
  document.querySelectorAll('.error').forEach(field => {
    field.classList.remove('error');
  });
  
  // Funzione per verificare se un elemento è visibile nel DOM
  function isElementVisible(el) {
    if (!el) return false;
    let parent = el;
    while (parent && parent !== document) {
      if (getComputedStyle(parent).display === 'none') return false;
      parent = parent.parentElement;
    }
    return true;
  }
  
  // Validazione dei campi input, select e textarea obbligatori
  document.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
    if (isElementVisible(input) && !input.value) {
      showError(input.id || input.name);
      isValid = false;
    }
  });
  
  // Validazione dei radio button obbligatori
  const radioGroups = new Set();
  document.querySelectorAll('input[type="radio"][required]').forEach(radio => {
    if (isElementVisible(radio)) radioGroups.add(radio.name);
  });
  
  radioGroups.forEach(name => {
    if (!document.querySelector(`input[name="${name}"]:checked`)) {
      showError(name);
      isValid = false;
    }
  });
  
  // Validazione dei checkbox con vincoli di selezione
  document.querySelectorAll('.checkbox-group').forEach(group => {
    if (!isElementVisible(group)) return;
    
    // Verifica "almeno uno richiesto"
    const requiredCheckboxes = group.querySelectorAll('.at-least-one-required');
    if (requiredCheckboxes.length > 0) {
      const fieldName = requiredCheckboxes[0].name;
      const checkedCount = Array.from(requiredCheckboxes).filter(chk => chk.checked).length;
      
      if (checkedCount === 0) {
        showError(fieldName);
        isValid = false;
      }
    }
    
    // Verifica "massimo tre richiesti"
    const maxThreeCheckboxes = group.querySelectorAll('.max-three-required');
    if (maxThreeCheckboxes.length > 0) {
      const fieldName = maxThreeCheckboxes[0].name;
      const checkedCount = Array.from(maxThreeCheckboxes).filter(chk => chk.checked).length;
      
      if (checkedCount > 3) {
        showError(fieldName);
        isValid = false;
      }
    }
  });
  
  return isValid;
}

/**
 * Mostra il messaggio di errore per un campo
 */
function showError(fieldId) {
  // Cerca l'elemento errore sia per id che per name (per radio e checkbox)
  const errorElement = document.getElementById(`${fieldId}-error`);
  if (errorElement) {
    errorElement.style.display = 'block';
    
    // Evidenzia il campo con l'errore
    const field = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
    if (field) {
      field.classList.add('error');
    }
  }
}

/**
 * Nasconde il messaggio di errore per un campo
 */
function hideError(fieldId) {
  const errorElement = document.getElementById(`${fieldId}-error`);
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

/**
 * Scorre fino al primo errore visualizzato
 */
function scrollToFirstError() {
  const firstError = document.querySelector('.error-message[style="display: block;"]');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Prepara i dati del form per l'invio
 * @returns {Object} - Dati del form pronti per l'invio
 */
function prepareFormData() {
  const form = document.getElementById('questionnaireForm');
  const formData = new FormData(form);
  const formDataObj = {};
  
  // Gestione speciale per checkbox (valori multipli)
  formData.forEach((value, key) => {
    if (formDataObj[key]) {
      if (!Array.isArray(formDataObj[key])) {
        formDataObj[key] = [formDataObj[key]];
      }
      formDataObj[key].push(value);
    } else {
      formDataObj[key] = value;
    }
  });
  
  // Converti array in stringhe CSV
  for (const key in formDataObj) {
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
  const scriptURL = 'https://script.google.com/macros/s/AKfycbwnG8nkLg_oSY2iSVUgfljFmPlQku1W58rHHZaKFYuISK3HIC48uvGEKDiSmFDFGOudmw/exec';
  
  // Aggiorna UI per feedback
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.textContent = 'Invio in corso...';
  
  // Aggiorna feedback
  const feedbackElement = document.getElementById('submitFeedback');
  if (feedbackElement) {
    feedbackElement.textContent = 'Invio in corso... Attendere prego.';
  }
  
  // Prepara URLSearchParams per l'invio ordinato dei dati
  const params = new URLSearchParams();
  
  // Aggiungi tutti i campi
  for (const [key, value] of Object.entries(data)) {params.append(key, value);
  }
  
  // Configura timeout per richiesta
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // timeout dopo 30 secondi
  
  // Invia dati utilizzando fetch API
  fetch(scriptURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: controller.signal,
    redirect: 'follow',
    mode: 'cors'
  })
  .then(response => {
    if (!response.ok) throw new Error('Errore nella risposta del server');
    return response.ok ? { result: 'success' } : response.json();
  })
  .then(() => {
    // Mostra messaggio di ringraziamento
    const thankYouMessage = document.getElementById('thankYouMessage');
    if (thankYouMessage) {
      thankYouMessage.style.display = 'block';
      thankYouMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Nascondi form dopo breve ritardo
    setTimeout(() => {
      // Nascondi tutto tranne il messaggio di ringraziamento
      Array.from(document.getElementById('questionnaireForm').children).forEach(child => {
        if (child.id !== 'thankYouMessage') {
          child.style.display = 'none';
        }
      });
    }, 1000);
    
    // Aggiorna feedback
    const feedbackElement = document.getElementById('submitFeedback');
    if (feedbackElement) {
      feedbackElement.textContent = 'Invio completato con successo!';
      feedbackElement.style.backgroundColor = '#d4edda';
      feedbackElement.style.borderColor = '#c3e6cb';
    }
  })
  .catch(error => {
    console.error('Errore:', error);
    
    // Personalizza messaggio di errore
    let errorMessage = 'Errore durante l\'invio. ';
    
    if (error.name === 'AbortError') {
      errorMessage += 'La richiesta è scaduta. Verifica la tua connessione e riprova.';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Problema di connessione. Verifica la tua connessione internet e riprova.';
    } else {
      errorMessage += 'Riprova più tardi o contatta l\'amministratore.';
    }
    
    // Aggiorna feedback in caso di errore
    const feedbackElement = document.getElementById('submitFeedback');
    if (feedbackElement) {
      feedbackElement.textContent = errorMessage;
      feedbackElement.style.backgroundColor = '#f8d7da';
      feedbackElement.style.borderColor = '#f5c6cb';
    }
    
    // Riabilita pulsante di invio
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Riprova';
  })
  .finally(() => {
    clearTimeout(timeoutId);
  });
}
