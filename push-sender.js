const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUPABASE_URL = 'https://kuilgkjslbsovzapkxva.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

webpush.setVapidDetails('mailto:minjicolor@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws }
});

// 로그인/개인정보 없는 앱 — 개인화 조회 없이 따뜻한 범용 문구 풀에서 랜덤 선택
const MESSAGES = [
  '오늘 어디에 나를 썼어? 하루를 같이 돌아보자 :)',
  '오늘 하루 어떻게 썼는지 기록해봐 :)',
  '작은 기록이 습관을 만들어!',
  '오늘 소비 하나만 남겨볼까? 부담 없이 :)',
  '수고한 오늘, 어떤 소비가 있었는지 같이 봐줄게.',
  '괜찮아, 잘 쓴 날도 아쉬운 날도 다 기록이야. 오늘 것 남겨보자 :)',
];
function pickMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

async function sendPushToAll() {
  const { data, error } = await sb.from('push_subscriptions').select('subscription');
  if (error) { console.error('fetch error', error); return; }

  let success = 0, fail = 0;
  for (const row of data) {
    try {
      const msg = { title: '돈이', body: pickMessage() };
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
