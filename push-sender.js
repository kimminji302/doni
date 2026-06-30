const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUPABASE_URL = 'https://kuilgkjslbsovzapkxva.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

webpush.setVapidDetails('mailto:minjicolor@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendPushToAll() {
  const { data, error } = await sb.from('push_subscriptions').select('subscription');
  if (error) { console.error('fetch error', error); return; }

  const messages = [
    { title: '돈이 🪙', body: '오늘 소비 기록했어요? 🌿' },
    { title: '돈이 🪙', body: '오늘 하루 어떻게 썼는지 기록해봐요 ☁️' },
    { title: '돈이 🪙', body: '작은 기록이 습관을 만들어요 🌱' },
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];

  let success = 0, fail = 0;
  for (const row of data) {
    try {
      await webpush.sendNotification(JSON.parse(row.subscription), JSON.stringify(msg));
      success++;
    } catch(e) {
      fail++;
      if (e.statusCode === 410) {
        // 만료된 구독 삭제
        await sb.from('push_subscriptions').delete().eq('subscription', row.subscription);
      }
    }
  }
  console.log(`완료: 성공 ${success}건, 실패 ${fail}건`);
}

sendPushToAll();
