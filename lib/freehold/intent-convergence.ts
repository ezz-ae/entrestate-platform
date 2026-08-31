/**
 * ENGINE 07 / 06 — THE INTENT CONVERGENCE INDEX (ICI).
 *
 * A person who registers twice is not an administrative duplicate. They came
 * back because the first touch was too slow, or they did not trust it, or
 * they simply want it badly — and WHAT they came back for says which. Two
 * apartments in JVC is a buyer closing in on a decision. A villa in Arabian
 * Ranches and then a studio in JVC is somebody browsing the whole city.
 *
 * The index compares the two inquiries on the two things a property enquiry
 * always declares — the asset class and the area — with equal weight:
 *
 *     ICI = 0.5 · match(type)  +  0.5 · match(area)
 *
 * At or above ICI_CONVERGENT the buyer is CONVERGENT: Engine 06 lifts the
 * lead to Rate 8 and Engine 07 starts the 15-minute neglect clock. Below it
 * the inquiry is logged on the lead's timeline and nothing escalates — the
 * sales floor is protected from browse-spam by the same rule that surfaces
 * the buyer who means it.
 *
 * UNKNOWN IS NOT A MATCH. When either side cannot say its area, that term
 * scores zero; two inquiries the system knows nothing about are never
 * declared convergent by the absence of evidence. The one exception is the
 * same project slug on both sides, which is the same thing in the same place
 * by definition.
 *
 * The vocabularies below are deliberately small and explicit. They resolve
 * enquiry text in the three languages the product speaks (EN/AR/RU) to one
 * canonical area key and one asset class — nothing about the person, only
 * about the property. Nationality and origin are not read anywhere in this
 * module; see lib/freehold/audience-pattern.ts for why that rule exists.
 *
 * Pure — no I/O. lib/freehold/inbound-touch.ts feeds it from the database;
 * scripts/intent-convergence-test.ts pins the arithmetic and the vocabulary.
 */

export const ICI_WEIGHTS = { type: 0.5, area: 0.5 } as const
/** Convergent at or above this — the spec's threshold, verbatim. */
export const ICI_CONVERGENT = 0.5

/**
 * A studio is a size of apartment, not a class of asset — a person who asked
 * for a studio and then a 1BR in the same tower is converging, not
 * scattering. So it folds into 'apartment'.
 */
export const ASSET_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'plot', 'commercial'] as const
export type AssetType = (typeof ASSET_TYPES)[number]

/**
 * Asset-class vocabulary. Order matters: more specific words first, so
 * "penthouse apartment" resolves to penthouse and "villa plot" to plot.
 * Latin terms match on word boundaries; Arabic and Cyrillic terms match as
 * substrings because those scripts carry no \b a regex can honour.
 */
const ASSET_TERMS: Array<[AssetType, readonly string[]]> = [
  ['plot', ['plot', 'land', 'أرض', 'ارض', 'участок', 'земл']],
  ['penthouse', ['penthouse', 'بنتهاوس', 'بنت هاوس', 'пентхаус']],
  ['townhouse', ['townhouse', 'town house', 'تاون هاوس', 'تاونهاوس', 'таунхаус']],
  ['villa', ['villa', 'villas', 'فيلا', 'فلل', 'فيلات', 'вилл']],
  ['commercial', ['office', 'retail', 'shop', 'warehouse', 'commercial', 'مكتب', 'محل', 'تجاري', 'офис', 'коммерч', 'магазин']],
  ['apartment', ['apartment', 'apartments', 'flat', 'apt', 'studio', '1br', '2br', '3br', '4br', 'bedroom', 'شقة', 'شقق', 'ستوديو', 'استوديو', 'غرفة', 'غرف', 'квартир', 'апартамент', 'студи']],
]

/**
 * Area vocabulary: canonical key → every spelling the three languages and the
 * ad-copy habit of the market produce for it. Multi-word aliases are matched
 * before shorter ones so "dubai hills" never resolves to a bare "dubai".
 */
export const AREA_ALIASES: Record<string, readonly string[]> = {
  jvc: ['jumeirah village circle', 'jvc', 'قرية جميرا الدائرية', 'جي في سي', 'джумейра вилладж серкл', 'jvc'],
  jvt: ['jumeirah village triangle', 'jvt', 'قرية جميرا المثلثة'],
  jlt: ['jumeirah lakes towers', 'jumeirah lake towers', 'jlt', 'أبراج بحيرات جميرا', 'джумейра лейкс тауэрс'],
  jbr: ['jumeirah beach residence', 'jbr', 'جميرا بيتش ريزيدنس'],
  marina: ['dubai marina', 'marina', 'مارينا', 'дубай марина', 'марина'],
  downtown: ['downtown dubai', 'downtown', 'داون تاون', 'وسط مدينة دبي', 'даунтаун'],
  business_bay: ['business bay', 'الخليج التجاري', 'бизнес бей'],
  palm_jumeirah: ['palm jumeirah', 'the palm', 'palm', 'نخلة جميرا', 'النخلة', 'пальм джумейра', 'пальма'],
  dubai_hills: ['dubai hills estate', 'dubai hills', 'دبي هيلز', 'дубай хиллс'],
  creek_harbour: ['dubai creek harbour', 'creek harbour', 'creek harbor', 'خور دبي', 'крик харбор'],
  arjan: ['arjan', 'أرجان', 'ارجان', 'арджан'],
  dubailand: ['dubailand', 'دبي لاند', 'дубайленд'],
  damac_hills: ['damac hills 2', 'damac hills', 'akoya', 'داماك هيلز', 'дамак хиллс'],
  damac_lagoons: ['damac lagoons', 'داماك لاجونز', 'дамак лагунс'],
  sports_city: ['dubai sports city', 'sports city', 'المدينة الرياضية', 'спортс сити'],
  motor_city: ['motor city', 'موتور سيتي', 'мотор сити'],
  al_furjan: ['al furjan', 'furjan', 'الفرجان', 'аль фурджан'],
  dubai_south: ['dubai south', 'expo city', 'دبي الجنوب', 'дубай саут'],
  mbr_city: ['mohammed bin rashid city', 'mbr city', 'meydan', 'sobha hartland', 'مدينة محمد بن راشد', 'ميدان', 'мейдан'],
  jumeirah: ['jumeirah 1', 'jumeirah 2', 'jumeirah 3', 'jumeirah', 'جميرا', 'джумейра'],
  bluewaters: ['bluewaters', 'بلوواترز', 'блуотерс'],
  emaar_beachfront: ['emaar beachfront', 'beachfront', 'إعمار بيتش فرونت', 'бичфронт'],
  al_barsha: ['al barsha', 'barsha', 'البرشاء', 'аль барша'],
  discovery_gardens: ['discovery gardens', 'ديسكفري جاردنز'],
  international_city: ['international city', 'المدينة العالمية', 'интернешнл сити'],
  silicon_oasis: ['dubai silicon oasis', 'silicon oasis', 'واحة السيليكون', 'силикон оазис'],
  mirdif: ['mirdif', 'مردف', 'мирдиф'],
  town_square: ['town square', 'تاون سكوير', 'таун сквер'],
  arabian_ranches: ['arabian ranches 3', 'arabian ranches 2', 'arabian ranches', 'المرابع العربية', 'арабиан ранчес'],
  tilal_al_ghaf: ['tilal al ghaf', 'تلال الغاف'],
  difc: ['difc', 'مركز دبي المالي', 'дифс'],
  zaabeel: ["za'abeel", 'zabeel', 'زعبيل'],
  al_jaddaf: ['al jaddaf', 'jaddaf', 'الجداف'],
  dubai_islands: ['dubai islands', 'deira islands', 'جزر دبي', 'дубай айлендс'],
  mina_rashid: ['mina rashid', 'rashid yachts', 'ميناء راشد'],
  maritime_city: ['dubai maritime city', 'maritime city', 'مدينة دبي الملاحية'],
  studio_city: ['dubai studio city', 'studio city', 'ستوديو سيتي'],
  production_city: ['dubai production city', 'production city', 'impz'],
  jumeirah_golf_estates: ['jumeirah golf estates', 'jge', 'جميرا غولف'],
  the_valley: ['the valley', 'ذا فالي'],
  dip: ['dubai investment park', 'dip', 'مجمع دبي للاستثمار'],
  jebel_ali: ['jebel ali', 'جبل علي', 'джебель али'],
  al_marjan: ['al marjan island', 'marjan island', 'al marjan', 'جزيرة المرجان', 'аль марджан'],
  yas_island: ['yas island', 'جزيرة ياس', 'яс айленд'],
  saadiyat: ['saadiyat island', 'saadiyat', 'السعديات', 'саадият'],
  city_walk: ['city walk', 'سيتي ووك', 'сити уок'],
  al_wasl: ['al wasl', 'الوصل'],
  dubai_harbour: ['dubai harbour', 'دبي هاربور', 'дубай харбор'],
  la_mer: ['la mer', 'لامير'],
  sobha_one: ['sobha one', 'ras al khor'],
}

/** Aliases sorted longest first so the most specific spelling wins. */
const AREA_ORDER: Array<[string, string]> = Object.entries(AREA_ALIASES)
  .flatMap(([key, aliases]) => aliases.map((a) => [key, a.toLowerCase()] as [string, string]))
  .sort((a, b) => b[1].length - a[1].length)

const LATIN = /^[a-z0-9' .-]+$/

function containsTerm(hay: string, term: string): boolean {
  if (!term) return false
  if (!LATIN.test(term)) return hay.includes(term)
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(hay)
}

/** Lower-case, and slug punctuation ("business-bay_2br", "lp/jvc") to spaces. */
const norm = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().replace(/[_/-]+/g, ' ').replace(/\s+/g, ' ').trim()

/** Resolve free text (interest, message, a landing slug) to a canonical area key. */
export function detectArea(...texts: Array<string | null | undefined>): string | null {
  const hay = texts.map(norm).filter(Boolean).join(' · ')
  if (!hay) return null
  for (const [key, alias] of AREA_ORDER) {
    if (containsTerm(hay, alias)) return key
  }
  return null
}

/** Resolve free text to one asset class, or null when it names none. */
export function detectAssetType(...texts: Array<string | null | undefined>): AssetType | null {
  const hay = texts.map(norm).filter(Boolean).join(' · ')
  if (!hay) return null
  for (const [type, terms] of ASSET_TERMS) {
    if (terms.some((t) => containsTerm(hay, t.toLowerCase()))) return type
  }
  return null
}

/** Normalise a project's own area string ("Jumeirah Village Circle") to the key. */
export function areaKeyOf(area: string | null | undefined): string | null {
  const a = norm(area)
  // The inventory layer defaults an unknown area to the city name; that is
  // not a location a buyer converges on.
  if (!a || a === 'dubai' || a === 'دبي') return null
  return detectArea(a)
}

/** Map the inventory's unit-type strings ("2BR", "Villa 4BR") to one class. */
export function assetTypeOfUnits(unitTypes: readonly string[]): AssetType | null {
  if (!unitTypes.length) return null
  return detectAssetType(unitTypes.join(' ')) ?? 'apartment'
}

export interface InquirySignals {
  projectSlug?: string | null
  /** The project's own area and unit types, when the slug resolved. */
  projectArea?: string | null
  projectUnitTypes?: readonly string[] | null
  interest?: string | null
  message?: string | null
  landingSlug?: string | null
}

export interface InquiryDescriptor {
  projectSlug: string | null
  area: string | null
  assetType: AssetType | null
}

/**
 * What one inquiry is about. The project's own facts win over the enquiry
 * text — a person who registered on the JVC page for a villa project is a
 * villa enquiry in JVC whatever they typed in the message box.
 */
export function describeInquiry(s: InquirySignals): InquiryDescriptor {
  const slug = (s.projectSlug ?? '').trim().toLowerCase() || null
  const area = areaKeyOf(s.projectArea) ?? detectArea(s.interest, s.landingSlug, s.message, slug)
  const assetType = assetTypeOfUnits(s.projectUnitTypes ?? []) ?? detectAssetType(s.interest, s.landingSlug, s.message, slug)
  return { projectSlug: slug, area, assetType }
}

export interface IciResult {
  ici: number
  typeMatch: 0 | 1
  areaMatch: 0 | 1
  sameProject: boolean
  convergent: boolean
  first: InquiryDescriptor
  second: InquiryDescriptor
}

/**
 * THE index. Same project on both sides is convergent by definition; otherwise
 * each term scores 1 only when both sides KNOW the value and agree.
 */
export function intentConvergence(first: InquiryDescriptor, second: InquiryDescriptor): IciResult {
  const sameProject = !!first.projectSlug && first.projectSlug === second.projectSlug
  const typeMatch: 0 | 1 = sameProject || (!!first.assetType && first.assetType === second.assetType) ? 1 : 0
  const areaMatch: 0 | 1 = sameProject || (!!first.area && first.area === second.area) ? 1 : 0
  const ici = Math.round((ICI_WEIGHTS.type * typeMatch + ICI_WEIGHTS.area * areaMatch) * 100) / 100
  return { ici, typeMatch, areaMatch, sameProject, convergent: ici >= ICI_CONVERGENT, first, second }
}
