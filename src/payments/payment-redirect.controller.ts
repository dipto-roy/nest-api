/**
 * Payment Redirect Controller
 * 
 * Handles Stripe redirect URLs (success/cancel)
 * In production, these would redirect to your frontend application
 */
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('payment')
export class PaymentRedirectController {
  /**
   * Handle successful payment redirect from Stripe
   * In production, redirect to frontend success page
   */
  @Get('success')
  paymentSuccess(@Query('session_id') sessionId: string, @Res() res: Response) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Successful</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }
          .success-icon {
            font-size: 64px;
            color: #10b981;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 10px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
          }
          .session-id {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 20px 0;
          }
          .info {
            background: #dbeafe;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
            color: #1e40af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Your payment has been processed successfully.</p>
          <p>The order status has been updated via webhook.</p>
          
          <div class="session-id">
            <strong>Session ID:</strong><br>
            ${sessionId || 'Not provided'}
          </div>
          
          <div class="info">
            <strong>💡 Production Note:</strong><br>
            In production, this endpoint should redirect to your frontend application's success page.
          </div>
          
          <p style="margin-top: 20px; font-size: 14px;">
            You can now close this window and check your order status via the API.
          </p>
        </div>
      </body>
      </html>
    `);
  }

  /**
   * Handle payment cancellation redirect from Stripe
   * In production, redirect to frontend cancel/retry page
   */
  @Get('cancel')
  paymentCancel(@Res() res: Response) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Cancelled</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }
          .cancel-icon {
            font-size: 64px;
            color: #ef4444;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 10px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
          }
          .info {
            background: #fef3c7;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="cancel-icon">❌</div>
          <h1>Payment Cancelled</h1>
          <p>Your payment was cancelled. No charges have been made.</p>
          <p>Your order remains in PENDING status.</p>
          
          <div class="info">
            <strong>💡 Production Note:</strong><br>
            In production, this endpoint should redirect to your frontend application where users can retry the payment.
          </div>
          
          <p style="margin-top: 20px; font-size: 14px;">
            You can create a new checkout session to try again.
          </p>
        </div>
      </body>
      </html>
    `);
  }
}
