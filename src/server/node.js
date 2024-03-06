const ky = require('ky-universal')
const fs = require('fs').promises
const path = require('path')

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

async function savePdfToFile(input, filePath, fileName = null) {
  try {
    if (!fileName) {
      fileName = `${input.invoiceNr}.pdf`
    }
    const fullFilePath = path.join(filePath, fileName)
    if (input.invoice.startsWith('http://') || input.invoice.startsWith('https://')) {
      const response = await ky(input.invoice);
      const buffer = await response.buffer();
      await fs.writeFile(fullFilePath, buffer);
      return {
        filePath: fullFilePath,
        fileName
      }
    } else {
      const base64Data = input.replace(/^data:application\/pdf;base64,/, '');
      // eslint-disable-next-line no-undef
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(fullFilePath, pdfBuffer);
      return {
        filePath: fullFilePath,
        fileName
      }
    }
  } catch (err) {
    console.error('Error saving the PDF file:', err);
  }
}

module.exports = {
  generateInvoice,
  savePdfToFile
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