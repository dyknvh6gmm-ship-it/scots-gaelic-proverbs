// Sean-fhaclan & Auld Sayins — daily newsletter email
//
// This is a Supabase Edge Function. Deploy it via:
//   Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor"
//   → name it "send-daily-proverb" → paste this whole file in → Deploy.
//
// Then add one secret (Edge Functions → send-daily-proverb → Secrets):
//   RESEND_API_KEY — get this free from resend.com (see README "Push notifications
//   and email" section for the full walkthrough).
//
// SUPABASE_URL and a service-level secret key are injected automatically by
// Supabase into every Edge Function — you don't need to set those yourself.
// Supabase has two generations of this: newer projects expose
// SUPABASE_SECRET_KEYS (a JSON dictionary), older ones expose
// SUPABASE_SERVICE_ROLE_KEY (a single JWT string). getServiceKey() below checks
// both, so this works either way.
//
// Once deployed, schedule it to run once a day — see README for how, using
// Supabase's built-in Cron Jobs feature.
//
// Deliverability note: this also sends a List-Unsubscribe header (RFC 8058
// one-click unsubscribe) pointing at the "unsubscribe" Edge Function, plus a
// plain-text body alongside the HTML one. Gmail/Yahoo weight both of these
// for recurring mail like this — without them, mail is much more likely to
// land in spam/junk even with SPF/DKIM/DMARC all correctly configured.
// Deploy supabase-function-unsubscribe.ts as "unsubscribe" for the link to
// actually work.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getServiceKey(): string {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      const values = Array.isArray(parsed) ? parsed : Object.values(parsed);
      const first = values.find((v) => typeof v === "string" && v.length > 0);
      if (first) return first as string;
    } catch (_e) {
      // Not JSON — treat the raw env value as the key itself.
      return secretKeys;
    }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("No Supabase service key found — checked SUPABASE_SECRET_KEYS and SUPABASE_SERVICE_ROLE_KEY.");
}

// Same token scheme used by supabase-function-unsubscribe.ts to verify the
// link — keep these in sync if you ever change this.
async function hmacToken(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// The full proverb pool — every proverb on the site that has an English
// rendering (all 106 of them), each with whichever of Scots/Gaelic it also
// has recorded (many are Gaelic+English or Scots+English only, not all three —
// that's fine, the email below only shows the languages a given proverb has).
// This mirrors supabase-function-send-daily-push.ts and the "proverb-data"
// JSON block embedded in index.html — if you add proverbs there, regenerate
// this list to match so the site, the push notification and this email all
// draw from the same, growing pool instead of repeating a small handful.
const PROVERBS: { id: number; scots: string | null; gaelic: string | null; english: string }[] = [
  { id: 1, scots: "Thay gang faur that disna meet ae day.", gaelic: "Coinnichidh na daoine far nach coinnich na cnuic.", english: "It's a small world." },
  { id: 2, scots: "It's a bare muir that ye gang throu and no find a heather cou.", gaelic: "Chan eil tuil air nach tig traoghadh.", english: "It's a long lane that has no turning." },
  { id: 3, scots: "The sowter's wife is aye the warst shod.", gaelic: "Is minig a bha droch bhròg air mnaoi griasaiche.", english: "The cobbler's wife is always the worst shod." },
  { id: 4, scots: "Better a moose in the pat nor nae flesh.", gaelic: "Is fheàrr an t-iasg na thig na làimh na dhà a' dol às.", english: "A bird in the hand is worth two in the bush." },
  { id: 5, scots: "A man o wirds but no o deeds is like a gairden fou wi weeds.", gaelic: "Is fheàrr obair na beul.", english: "Actions speak louder than words." },
  { id: 6, scots: "A fuil and his siller's easy pairtit.", gaelic: null, english: "A fool and his money are soon parted." },
  { id: 7, scots: "A guid name's suiner tint nor wun.", gaelic: null, english: "A good name is easier lost than won." },
  { id: 8, scots: "A gien cou shoudna be leukit in the mou.", gaelic: null, english: "Don't look a gift horse in the mouth." },
  { id: 9, scots: "A rowin stane gaithers nae fog.", gaelic: null, english: "A rolling stone gathers no moss." },
  { id: 10, scots: "An ill shearer aye blames his tuils.", gaelic: null, english: "A bad workman always blames his tools." },
  { id: 11, scots: "As ae door's steekit anither appens.", gaelic: null, english: "When one door closes, another opens." },
  { id: 12, scots: "Auld speugies is ill tae tame.", gaelic: null, english: "You can't teach an old dog new tricks." },
  { id: 13, scots: "Better suin nor syne.", gaelic: null, english: "Better sooner than later." },
  { id: 14, scots: "It's an ill bird that fyles it's ain nest.", gaelic: null, english: "Don't foul your own nest." },
  { id: 15, scots: "It's like butter in the black dug's hause.", gaelic: null, english: "Don't cry over spilt milk." },
  { id: 16, scots: "Keep yer ain fish-guts tae yer ain seamaws.", gaelic: null, english: "Charity begins at home." },
  { id: 17, scots: "Ne'er find faut wi ma shuin unless ye pey ma souter.", gaelic: null, english: "Don't criticise something that's none of your business." },
  { id: 18, scots: "The pruif o the pudden's in the preein o't.", gaelic: null, english: "The proof of the pudding is in the eating." },
  { id: 19, scots: "Ye canna pit a young heid on auld shouders.", gaelic: null, english: "You can't put an old head on young shoulders." },
  { id: 20, scots: "Gae tae bed wi the lamm and rise wi the laverock.", gaelic: null, english: "Early to bed, early to rise, makes a man healthy, wealthy, and wise." },
  { id: 21, scots: "Hunger's a guid kitchen.", gaelic: null, english: "Hunger is the best sauce." },
  { id: 22, scots: "Mony a puckle maks a muckle.", gaelic: null, english: "Many a little makes a mickle." },
  { id: 23, scots: "Facts is chields that winna ding.", gaelic: null, english: "Facts are stubborn things." },
  { id: 24, scots: "He that sleeps wi dugs maun rise wi flaes.", gaelic: null, english: "He that lies down with dogs will rise with fleas." },
  { id: 25, scots: null, gaelic: "Am mac mar an t-athair.", english: "Like father, like son." },
  { id: 26, scots: null, gaelic: "A' nighean mar a màthair.", english: "Like mother, like daughter." },
  { id: 27, scots: null, gaelic: "A-staigh air an dàrna cluais 's a-mach air a' chluais eile.", english: "In one ear and out the other." },
  { id: 28, scots: null, gaelic: "Chan eil thu tuilleadh 's sean airson ionnsachadh fhathast.", english: "Live and learn." },
  { id: 29, scots: null, gaelic: "A' bhiast as mutha ag ithe na beiste as lugha.", english: "Big fish eat little fish." },
  { id: 30, scots: null, gaelic: "Èist ri gaoth nam beann gus an tràogh na h-uisgeachan.", english: "Keep a low profile until the trouble passes." },
  { id: 31, scots: null, gaelic: "Is dà thrian tionnsgnadh.", english: "Well begun is half done." },
  { id: 32, scots: null, gaelic: "Is fheàrr Gàidhlig bhriste na Gàidhlig sa chiste.", english: "Better broken Gaelic than dead Gaelic." },
  { id: 33, scots: null, gaelic: "'S fheàrr càirdeas na òr.", english: "Friendship is better than gold." },
  { id: 34, scots: null, gaelic: "Is fheàrr gàire na bròn.", english: "Laughter is better than sorrow." },
  { id: 35, scots: null, gaelic: "Na toir breith air rèir coltais, faodaidh cridhe beartach a bhith fo chòta bochd.", english: "Don't judge a book by its cover." },
  { id: 36, scots: null, gaelic: "Triùir a thig gun iarraidh – gaol, eud is eagal.", english: "Three things come unbidden: love, jealousy, and fear." },
  { id: 37, scots: null, gaelic: "Tha fios aig an luch nach eil an cat 's an taigh.", english: "When the cat's away, the mice will play." },
  { id: 38, scots: null, gaelic: "Chuir sin an clamhan gobhlach am measg nan cearc.", english: "That put the cat among the pigeons." },
  { id: 39, scots: null, gaelic: "Cha tèid bòidhchead na's doimhne na an craiceann.", english: "Beauty is only skin deep." },
  { id: 40, scots: null, gaelic: "Cha shìn duine a chas ach mar a ruigeas aodach.", english: "Cut your coat according to your cloth." },
  { id: 41, scots: null, gaelic: "Duine an dòras bhon taobh eile.", english: "Out you go, the other way." },
  { id: 42, scots: null, gaelic: "An rud a thèid fada bhon t-sùil, thèid e fada bhon chridhe.", english: "Out of sight, out of mind." },
  { id: 43, scots: null, gaelic: "Am fear a bhios fada aig an aiseag, gheibh e thairis uaireigin.", english: "Everything comes to him who waits." },
  { id: 44, scots: null, gaelic: "An rud nach gabh leasachadh, is fheudar cur suas leis.", english: "What can't be cured must be endured." },
  { id: 45, scots: null, gaelic: "B' e sin an connadh a chur dhan choille.", english: "Sending coals to Newcastle." },
  { id: 46, scots: null, gaelic: "Bheir an èiginn air rudeigin a dhèanamh.", english: "Necessity is the mother of invention." },
  { id: 47, scots: "Ae man may lead a horse to the water, but ane and twenty winna gar him drink.", gaelic: "Bheir aon fhear each gu uisge, ach cha toir a dhà-dheug air òl.", english: "You can lead a horse to water, but you can't make it drink." },
  { id: 48, scots: null, gaelic: "Beus na tuath, far am bithear, is ann mar sin a nithear.", english: "When in Rome, do as the Romans do." },
  { id: 49, scots: "A gowk's errand.", gaelic: "Air ghnothach na cuthaige.", english: "A wild goose chase." },
  { id: 50, scots: null, gaelic: "Is mall a mharcaicheas am fear a bheachdaicheas.", english: "He who takes note rides slowly." },
  { id: 51, scots: null, gaelic: "Is i an dias as truime as isle a chromas a ceann.", english: "The heaviest ear of corn bends its head lowest." },
  { id: 52, scots: null, gaelic: "A' chuiseag a dh'fhàsas air an òtrach, is i as àirde a thogas a ceann.", english: "The weed that grows on the dunghill holds its head highest." },
  { id: 53, scots: null, gaelic: "A' bheinn as àirde a th' anns an tìr, 's ann oirre as trice a chithear an ceò.", english: "The highest mountain in the land is oftenest covered in mist." },
  { id: 54, scots: null, gaelic: "Cha dèan duine dona ach a dhìcheall.", english: "A poor man can do but his best." },
  { id: 55, scots: null, gaelic: "Abair ach beagan, is abair gu math e.", english: "Say but little, and say it well." },
  { id: 56, scots: null, gaelic: "Bidh an ùbhal as fheàrr air a' mheanglan as àirde.", english: "The best apple is on the highest branch." },
  { id: 57, scots: null, gaelic: "Anail a' Ghàidheil, air a mhullach!", english: "The Gael's breathing place is on the summit." },
  { id: 58, scots: null, gaelic: "A' bhliadhn' is gainne a' mhìn, dèan fuine mhòr aineamh.", english: "During the year when meal is scarce, let big bakings be few." },
  { id: 59, scots: null, gaelic: "A' chungaidh leighis is goirte, 's i is motha tha dèanamh feum.", english: "The medicine that hurts the most is generally the best healer." },
  { id: 60, scots: null, gaelic: "Aithnichear an leòmhann air sgrìob de ìnean.", english: "The lion is known by the scratch of its claw." },
  { id: 61, scots: null, gaelic: "An ràmh as fhaisge air làimh, iomair leis.", english: "The oar that's nearest at hand, row with it." },
  { id: 62, scots: null, gaelic: "A h-uile rud ach an rud bu chòir.", english: "Everything but the right thing." },
  { id: 63, scots: null, gaelic: "An rud a nithear gu math, chithear a bhuil.", english: "What is well done will be shown by results." },
  { id: 64, scots: null, gaelic: "An uair a chluinneas tu sgeul gun dreach, na creid i.", english: "When you hear a tale that is not pleasant, do not believe it." },
  { id: 65, scots: null, gaelic: "Air rèir do mheas ort fhèin, 's ann a mheasas each thu.", english: "According as thou esteemest thyself, others will esteem thee." },
  { id: 66, scots: null, gaelic: "An ràthad fada glan, is an ràthad goirid salach.", english: "The long clean road, and the short dirty road." },
  { id: 67, scots: null, gaelic: "Bu mhath an sgàthan sùil caraid.", english: "A friend's eye is a good looking-glass." },
  { id: 68, scots: null, gaelic: "Buinidh urram do'n aois.", english: "Honour belongs to old age." },
  { id: 69, scots: null, gaelic: "Is fheàrr a bhith sàmhach na droch dhàn a ghabhail.", english: "Better be silent than sing a bad song." },
  { id: 70, scots: null, gaelic: "Bithidh cron duine cho mòr ri beinn mas lèir dha fhèin e.", english: "A man's faults will be as large as a mountain ere he himself sees them." },
  { id: 71, scots: null, gaelic: "Bithidh na gobhair bodhar 's an fhoghar.", english: "There are none so deaf as those who will not hear." },
  { id: 72, scots: null, gaelic: "B'fheàrr a bhith gun bhreith na bhith gun teagasg.", english: "Better be without being than without instruction." },
  { id: 73, scots: null, gaelic: "B'fheàrr gun tòiseachadh na sguir gun chrìochnachadh.", english: "Better not to begin than stop without finishing." },
  { id: 74, scots: null, gaelic: "Cha bhi aon duine crìonna am measg mìle amadan.", english: "There will not be one wise man among a thousand fools." },
  { id: 75, scots: null, gaelic: "Cha'n aithnich thu duine gus am bi do ghnothach ris.", english: "You will never know a man until you do business with him." },
  { id: 76, scots: null, gaelic: "Cha sheas càirdeas air a lèth-chois.", english: "Friendship will not stand on one leg." },
  { id: 77, scots: null, gaelic: "Cha'n fheum an tì a shealbhaicheas an toradh am blàth a mhilleadh.", english: "He who would enjoy the fruit must not spoil the blossom." },
  { id: 78, scots: null, gaelic: "Cha chuirear gad air gealladh.", english: "A promise can never be tied." },
  { id: 79, scots: null, gaelic: "Cha mhisde sgeul mhath aithris dà uair.", english: "A good tale is not the worse of being twice told." },
  { id: 80, scots: null, gaelic: "Cha do dhùin doras nach d'fhosgail doras.", english: "No door closes without opening another door." },
  { id: 81, scots: null, gaelic: "Cha'n eil cleith air an olc, ach gun a dhèanamh.", english: "There is no concealment of evil but by avoiding it." },
  { id: 82, scots: null, gaelic: "Cha bhi luathas is grinneas còmhla.", english: "The more hurry, the less speed." },
  { id: 83, scots: null, gaelic: "Far is sàimhche an t-uisge, 's ann is doimhne e.", english: "Still waters run deep." },
  { id: 84, scots: null, gaelic: "Far am bi toil bidh gnìomh.", english: "Where there's a will there's a way." },
  { id: 85, scots: null, gaelic: "Fìor no breug, millear bean leis.", english: "True or false, 'twill injure a woman." },
  { id: 86, scots: null, gaelic: "Feumaidh gach beò a bheathachadh.", english: "All living creatures must be fed." },
  { id: 87, scots: null, gaelic: "Glèidhidh aire innleachd ged nach glèidh i oighreachd.", english: "Necessity incites inventiveness although it may not win a fortune." },
  { id: 88, scots: null, gaelic: "Gabhaidh gach dath dubh, ach cha ghabh dubh gach dath.", english: "Any colour will take black, but black will not take any colour." },
  { id: 89, scots: null, gaelic: "Ged is grinn an sìoda, is coma leis cò air am bi e.", english: "Though the silk be fine, it cares not who wears it." },
  { id: 90, scots: null, gaelic: "Is fheàrr an cù a bhogas earball na cù a chuireas dranndan air.", english: "Better the dog that dips its tail than the dog that snarls." },
  { id: 91, scots: null, gaelic: "Is mòr an eire an t-aineolas.", english: "Ignorance is a great burden." },
  { id: 92, scots: null, gaelic: "Is i a' chiall cheannaichte is fheàrr.", english: "Bought wit is best." },
  { id: 93, scots: null, gaelic: "Is fheàrr caitheamh na meirgeadh.", english: "Better wear than rust." },
  { id: 94, scots: null, gaelic: "Is buan gach olc.", english: "Evil is lasting." },
  { id: 95, scots: null, gaelic: "Is fheàrr duine na daoine.", english: "A man is better than men." },
  { id: 96, scots: null, gaelic: "Is math an seirbheiseach teine, ach 's olc a mhaighstir e.", english: "Fire is a good servant, but a bad master." },
  { id: 97, scots: null, gaelic: "Is mòr a dh'fhuilingeas cridhe ceart mas bris e.", english: "The upright heart endures a great deal before it breaks." },
  { id: 98, scots: null, gaelic: "Is ionann a bhith ad' thosd ri aideachadh.", english: "Silence is equivalent to confession." },
  { id: 99, scots: null, gaelic: "Is labhrach na builg fàs.", english: "An empty pail makes most noise." },
  { id: 100, scots: null, gaelic: "Labhraidh a bheul, ach 's e an gnìomh a dhearbhas.", english: "The mouth will speak, but deeds are the proof." },
  { id: 101, scots: null, gaelic: "Lìonar beàrn mòr le clachan beaga.", english: "Great gaps may be filled with small stones." },
  { id: 102, scots: null, gaelic: "Mar comas dhut teumadh, na ruisg do dh'eudan.", english: "Discretion is the better part of valour." },
  { id: 103, scots: null, gaelic: "Na las sop nach urrainn dut fhèin a chur às.", english: "Do not light a whisp you cannot yourself put out." },
  { id: 104, scots: null, gaelic: "Na toir breith air rèir coltais, faodaidh cridhe beartach a bhith fo chòta bochd.", english: "Judge not by appearances; a rich heart may be under a poor coat." },
  { id: 105, scots: null, gaelic: "Sìth do d'anam, is clach air do chàrn.", english: "Peace to your soul, and a stone on your cairn." },
  { id: 106, scots: null, gaelic: "Smaoinich gu math an toiseach, dèanadar an sin.", english: "Consider well in the first place, then act." },
];

function todaysProverb() {
  const now = new Date();
  const seed = now.getFullYear() * 372 + now.getMonth() * 31 + now.getDate();
  return PROVERBS[seed % PROVERBS.length];
}

Deno.serve(async () => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY is not set — add it under Edge Functions → send-daily-proverb → Secrets." }), { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    getServiceKey()
  );

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email")
    .eq("newsletter_opt_in", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!subscribers || subscribers.length === 0) {
    return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 });
  }

  const proverb = todaysProverb();

  // Only render a language block for languages this particular proverb
  // actually has — most entries are bilingual (Scots+English or
  // Gaelic+English), not all three.
  const langBlocks = [
    proverb.scots ? { label: "Beurla Ghallda", color: "#a3691f", text: proverb.scots } : null,
    proverb.gaelic ? { label: "Gàidhlig", color: "#5b2a86", text: proverb.gaelic } : null,
    { label: "Beurla", color: "#0065bd", text: proverb.english }
  ].filter(Boolean) as { label: string; color: string; text: string }[];

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2b2320;">
      <h2 style="color:#5b2a86; margin-bottom: 4px;">Sean-fhaclan &amp; Auld Sayins</h2>
      ${langBlocks.map((b) => `
      <p style="font-size:0.8rem; color:${b.color}; text-transform:uppercase; letter-spacing:0.04em; margin: 16px 0 2px;">${b.label}</p>
      <p style="font-size:1.15rem; margin: 0;">${b.text}</p>`).join("")}
      <p style="margin-top: 26px;">
        <a href="https://www.gaelicwithsteve.com/geama.html" style="display:inline-block; background:#5b2a86; color:#fff; text-decoration:none; padding:10px 20px; border-radius:999px; font-family:-apple-system,sans-serif; font-size:0.85rem; font-weight:600;">Cluich Am Facal — today's word game</a>
      </p>
      <p style="font-size:0.75rem; color:#888; margin-top: 20px;">You're getting this because you opted in on Sean-fhaclan &amp; Auld Sayins. Log in and turn off "Email me the proverb of the day" any time to stop, or use the unsubscribe link below.</p>
    </div>
  `;

  const textLines = langBlocks.map((b) => `${b.label}: ${b.text}`).join("\n");

  let sent = 0;
  for (const sub of subscribers) {
    const token = await hmacToken(sub.email, resendKey);
    const unsubUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${token}`;
    const text = `Sean-fhaclan & Auld Sayins\n\n${textLines}\n\nCluich Am Facal — today's word game: https://www.gaelicwithsteve.com/geama.html\n\nUnsubscribe: ${unsubUrl}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Sends from your verified gaelicwithsteve.com domain via Resend.
        from: "Sean-fhaclan <contact@gaelicwithsteve.com>",
        to: sub.email,
        subject: "Today's proverb — Sean-fhaclan & Auld Sayins",
        html,
        text,
        // RFC 8058 one-click unsubscribe — Gmail/Yahoo weight this heavily
        // for recurring mail. Requires supabase-function-unsubscribe.ts to
        // be deployed as "unsubscribe" for the link to actually work.
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      })
    });
    if (res.ok) sent++;
  }

  return new Response(JSON.stringify({ sent, total: subscribers.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
