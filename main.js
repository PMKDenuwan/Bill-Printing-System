const { ipcMain, dialog, app } = require('electron');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Install puppeteer if not already: npm install puppeteer

ipcMain.handle('generate-pdf', async (event, invoiceData) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Generate HTML content
        const htmlContent = generateInvoiceHTML(invoiceData);
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Configure PDF options
        const pdfOptions = {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            displayHeaderFooter: false
        };
        
        // Generate PDF buffer
        const pdfBuffer = await page.pdf(pdfOptions);
        
        await browser.close();
        
        // Save file dialog
        const defaultPath = path.join(app.getPath('downloads'), `Invoice-${invoiceData.invoiceNumber}.pdf`);
        const { filePath } = await dialog.showSaveDialog({
            defaultPath: defaultPath,
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]
        });
        
        if (filePath) {
            fs.writeFileSync(filePath, pdfBuffer);
            return { success: true, filePath: filePath };
        } else {
            return { success: false, error: 'Save cancelled by user' };
        }
        
    } catch (error) {
        console.error('PDF generation error:', error);
        return { success: false, error: error.message };
    }
});

function generateInvoiceHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice ${data.invoiceNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .invoice-container {
                max-width: 794px;
                margin: 0 auto;
                padding: 30px;
                background: white;
            }
            
            .invoice-header {
                display: grid;
                grid-template-columns: 80px 1fr auto;
                gap: 20px;
                align-items: start;
                padding: 20px 0;
                border-bottom: 3px solid #2563eb;
                margin-bottom: 30px;
            }
            
            .invoice-logo {
                width: 80px;
                height: 80px;
                background: #2563eb;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 24px;
            }
            
            .invoice-company h1 {
                font-size: 28px;
                font-weight: 800;
                color: #111827;
                margin-bottom: 4px;
            }
            
            .invoice-tagline {
                font-size: 14px;
                color: #2563eb;
                font-style: italic;
                font-weight: 500;
                margin-bottom: 8px;
            }
            
            .invoice-address {
                color: #6b7280;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .invoice-meta {
                text-align: right;
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #e5e7eb;
                min-width: 250px;
            }
            
            .invoice-meta h2 {
                font-size: 24px;
                font-weight: 800;
                color: #2563eb;
                margin-bottom: 12px;
            }
            
            .invoice-meta-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
                font-size: 13px;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 25px 0;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .items-table th {
                background: #2563eb;
                color: white;
                padding: 14px 12px;
                text-align: left;
                font-weight: 700;
                font-size: 13px;
            }
            
            .items-table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
                vertical-align: top;
            }
            
            .items-table tr:nth-child(even) {
                background: #f9fafb;
            }
            
            .size-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                background: white;
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid #d1d5db;
            }
            
            .size-table th {
                background: #e5e7eb;
                padding: 4px 6px;
                text-align: center;
                font-weight: 600;
                color: #374151;
                font-size: 10px;
            }
            
            .size-table td {
                padding: 4px 6px;
                text-align: center;
                border-bottom: 1px solid #e5e7eb;
                color: #374151;
            }
            
            .totals-section {
                margin-top: 25px;
                display: flex;
                justify-content: flex-end;
            }
            
            .totals-box {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                min-width: 300px;
                border: 2px solid #e5e7eb;
            }
            
            .total-line {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .grand-total {
                border-top: 2px solid #2563eb;
                padding-top: 12px;
                margin-top: 12px;
                font-weight: 700;
                font-size: 18px;
                color: #2563eb;
            }
            
            .settle-section {
                margin-top: 30px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
                border: 2px solid #e5e7eb;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
            }
            
            .settle-line {
                border-bottom: 2px solid #9ca3af;
                flex: 1;
                height: 2px;
            }
            
            .invoice-footer {
                margin-top: 30px;
                text-align: center;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
                color: #6b7280;
                font-size: 12px;
                line-height: 1.6;
                border-top: 2px solid #2563eb;
            }
            
            .item-photo {
                width: 50px;
                height: 50px;
                object-fit: cover;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="invoice-header">
                <div class="invoice-logo">ZY</div>
                
                <div class="invoice-company">
                    <h1>Zyentra Apparel Store</h1>
                    <div class="invoice-tagline">"Defining Style — Redefining You"</div>
                    <div class="invoice-address">
                        Matara<br>
                        Telephone: 0789822147
                    </div>
                </div>
                
                <div class="invoice-meta">
                    <h2>INVOICE</h2>
                    <div class="invoice-meta-item">
                        <span>Invoice No:</span>
                        <span>${data.invoiceNumber}</span>
                    </div>
                    <div class="invoice-meta-item">
                        <span>Date:</span>
                        <span>${data.invoiceDate}</span>
                    </div>
                    <div class="invoice-meta-item">
                        <span>Shop:</span>
                        <span>${data.shopName}</span>
                    </div>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Dress Name</th>
                        <th>Photo</th>
                        <th>Size Details</th>
                        <th>Total Qty</th>
                        <th>Amount (LKR)</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                        <tr>
                            <td><strong>${item.dressCode}</strong></td>
                            <td>${item.dressName}</td>
                            <td><img src="${item.photo}" class="item-photo" alt="Dress"></td>
                            <td>
                                <table class="size-table">
                                    <thead>
                                        <tr>
                                            <th>Size</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${item.sizes.map(s => `
                                            <tr>
                                                <td><strong>${s.size}</strong></td>
                                                <td>${s.quantity}</td>
                                                <td>${s.price.toFixed(2)}</td>
                                                <td>${s.total.toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </td>
                            <td><strong>${item.totalQuantity}</strong></td>
                            <td><strong>LKR ${item.totalAmount.toFixed(2)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totals-section">
                <div class="totals-box">
                    <div class="total-line">
                        <span>Total Items:</span>
                        <span>${data.totals.totalItems}</span>
                    </div>
                    <div class="total-line">
                        <span>Total Quantity:</span>
                        <span>${data.totals.totalQuantity}</span>
                    </div>
                    <div class="total-line grand-total">
                        <span>Grand Total:</span>
                        <span>LKR ${data.totals.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="settle-section">
                <span>Settle On:</span>
                <div class="settle-line"></div>
            </div>
            
            <div class="invoice-footer">
                <strong>©2025 Zyentra</strong><br>
                <strong>Zyentra Apparel Store</strong><br>
                <em>"Defining Style — Redefining You"</em><br>
                Telephone: 0789822147
            </div>
        </div>
    </body>
    </html>
    `;
  }