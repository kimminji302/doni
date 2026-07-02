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

// 사용자별 최근 기록 여부에 따라 맞춤 문구 선택
async function pickMessage(userId) {
  const fallback = [
    '오늘 소비 기록 했어?',
    '오늘 하루 어떻게 썼는지 기록해봐 :)',
    '작은 기록이 습관을 만들어!',
  ];
  try {
    // 서버는 UTC — 한국 시간 기준 오늘/어제 날짜 계산
    const kst = new Date(Date.now() + 9 * 3600 * 1000);
    const today = kst.toISOString().slice(0, 10);
    const yest = new Date(kst.getTime() - 86400000).toISOString().slice(0, 10);
    const { data, error } = await sb.from('expenses')
      .select('full_date').eq('user_id', userId).in('full_date', [today, yest]);
    if (error || !data) throw error;
    const hasToday = data.some(r => r.full_date === today);
    const hasYest = data.some(r => r.full_date === yest);
    if (hasToday) return '오늘도 기록했네, 최고야! 놓친 소비 없나 한 번만 더 봐줘 :)';
    if (hasYest)  return '오늘 기록 아직이지? 어제처럼 오늘도 남겨줘 :)';
    return '요즘 기록이 뜸하네. 부담 없이 오늘 것 하나만 남겨보자 :)';
  } catch (e) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
}

async function sendPushToAll() {
  const { data, error } = await sb.from('push_subscriptions').select('user_id, subscription');
  if (error) { console.error('fetch error', error); return; }

  // 같은 사용자의 기기 여러 대는 문구 조회를 한 번만
  const msgCache = {};
  let success = 0, fail = 0;
  for (const row of data) {
    try {
      if (!(row.user_id in msgCache)) msgCache[row.user_id] = await pickMessage(row.user_id);
      const msg = { title: '돈이', body: msgCache[row.user_id] };
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
