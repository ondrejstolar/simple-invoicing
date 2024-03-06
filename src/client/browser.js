const ky = require('ky-universal')

async function generateInvoice(invoiceObject) {
  try {
    const invoiceValidation = validateInvoice(invoiceObject)
    if (invoiceValidation.valid) {
      const response = await ky.post('https://simpleinvoicing.warberryapps.com/data/api/invoice/generate', {
        invoiceObject
      }).json();
      return response
    } else {
      return invoiceValidation
    }
  } catch (err) {
    console.log(err)
  }
}

function base64ToBlob(base64) {
  try {
    const contentType = 'application/pdf';
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], {
      type: contentType
    });
  } catch (err) {
    console.log(err)
  }
}

function printPdf(input) {
  try {
    let src;
    if (input.startsWith('http://') || input.startsWith('https://')) {
      src = input;
    } else {
      const blob = base64ToBlob(input);
      src = URL.createObjectURL(blob);
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = src;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.print();
      iframe.onload = null;
      setTimeout(() => {
        document.body.removeChild(iframe);
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
          URL.revokeObjectURL(src);
        }
      }, 100);
    };
  } catch (err) {
    console.log(err);
  }
}

function downloadPdf(invoice, filename = 'download.pdf') {
  try {
    const blob = base64ToBlob(invoice);
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.log(err)
  }
}

function renderPdf(input, targetDivId) {
  try {
    let src;
    if (input.startsWith('http://') || input.startsWith('https://')) {
      src = input;
    } else {
      const blob = base64ToBlob(input);
      src = URL.createObjectURL(blob);
    }

    const iframe = document.createElement('iframe');
    iframe.src = src;

    const targetDiv = document.getElementById(targetDivId);
    if (!targetDiv) throw new Error(`Div with id "${targetDivId}" not found.`);

    targetDiv.innerHTML = '';
    targetDiv.appendChild(iframe);
  } catch (err) {
    console.log(err);
  }
}


module.exports = {
  generateInvoice,
  base64ToBlob,
  printPdf,
  downloadPdf,
  renderPdf
};




function validateInvoice(invoice) {
  const requiredKeys = ['supplier', 'recipient', 'paymentDetails', 'items', 'invoiceDetails', 'invoiceSettings'];
  const errors = [];

  requiredKeys.forEach(key => {
    if (!(key in invoice)) {
      errors.push(`Missing key: ${key}`);
    }
  });

  function validateNestedObject(obj, keys, path) {
    keys.forEach(key => {
      if (!(key in obj)) {
        errors.push(`Missing key: ${path}.${key}`);
      }
    });
  }

  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    errors.push("Missing or empty 'items' array");
  } else {
    invoice.items.forEach((item, index) => {
      validateNestedObject(item, ['item', 'description', 'quantity', 'netAmount', 'grossAmount', 'tax', 'type'], `items[${index}]`);
    });
  }


  if (invoice.supplier) {
    validateNestedObject(invoice.supplier, ['name', 'address', 'city', 'country', 'postCode'], 'supplier');
  }

  if (invoice.recipient) {
    validateNestedObject(invoice.recipient, ['name', 'address', 'city', 'country', 'postCode'], 'recipient');
  }

  // if (invoice.paymentDetails) {
  //   validateNestedObject(invoice.paymentDetails, ['bankName', 'routing', 'account', 'accountType', 'IBAN', 'SWIFT'], 'paymentDetails');
  // }

  if (invoice.invoiceDetails) {
    validateNestedObject(invoice.invoiceDetails, ['issueDate', 'deliveryDate', 'dueDate', 'netSubtotal', 'grossTotal', 'invoiceNr', 'invoiceLanguage', 'currency'], 'invoiceDetails');
  }

  if (invoice.invoiceSettings) {
    validateNestedObject(invoice.invoiceSettings, ['returnAs'], 'invoiceSettings');
  }

  if (errors.length > 0) {
    console.error("Validation errors:", errors);
    return {
      valid: false,
      errors
    };
  } else {
    console.log("Invoice object is valid.");
    return {
      valid: true
    };
  }
}