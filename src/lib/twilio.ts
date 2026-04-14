import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env')
  }
  return twilio(accountSid, authToken)
}

export async function sendSms(to: string, body: string) {
  const client = getClient()
  const message = await client.messages.create({
    body,
    from: twilioPhoneNumber,
    to,
  })
  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    body: message.body,
    dateSent: message.dateSent,
  }
}

export async function sendBulkSms(recipients: string[], body: string) {
  const results = await Promise.allSettled(
    recipients.map(to => sendSms(to, body))
  )
  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  return { total: recipients.length, sent, failed, results }
}

export async function getMessageHistory(limit: number = 20) {
  const client = getClient()
  const messages = await client.messages.list({ limit })
  return messages.map(m => ({
    sid: m.sid,
    from: m.from,
    to: m.to,
    body: m.body,
    status: m.status,
    direction: m.direction,
    dateSent: m.dateSent,
    dateCreated: m.dateCreated,
  }))
}

// Voice calling
export async function makeCall(
  to: string,
  answerUrl: string,
  statusUrl: string
): Promise<{ sid: string; status: string }> {
  const client = getClient()
  const from = process.env.TWILIO_VOICE_NUMBER || twilioPhoneNumber
  if (!from) throw new Error('TWILIO_VOICE_NUMBER not configured')

  const call = await client.calls.create({
    to,
    from,
    url: answerUrl,
    method: 'POST',
    statusCallback: statusUrl,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST',
  })

  return { sid: call.sid, status: call.status }
}
