/**
 * Kenya’s 47 counties with principal towns / urban centres for territory pickers and address hints.
 * Towns are representative, not every settlement in the country.
 */
export interface KenyanCountyTowns {
  county: string;
  towns: string[];
}

const RAW: KenyanCountyTowns[] = [
  { county: 'Baringo', towns: ['Kabarnet', 'Eldama Ravine', 'Marigat', 'Mogotio', 'Chemolingot', 'Tenges'] },
  { county: 'Bomet', towns: ['Bomet', 'Silibwet', 'Longisa', 'Mulot', 'Chepalungu', 'Sigor'] },
  { county: 'Bungoma', towns: ['Bungoma', 'Webuye', 'Kimilili', 'Sirisia', 'Malakisi', 'Chwele'] },
  { county: 'Busia', towns: ['Busia', 'Malaba', 'Nambale', 'Butula', 'Funyula', 'Port Victoria'] },
  { county: 'Elgeyo-Marakwet', towns: ['Iten', 'Kapsowar', 'Chepkorio', 'Tot'] },
  { county: 'Embu', towns: ['Embu', 'Runyenjes', 'Manyatta', 'Kiritiri', 'Ishiara'] },
  { county: 'Garissa', towns: ['Garissa', 'Dadaab', 'Hulugho', 'Ijara', 'Fafi'] },
  { county: 'Homa Bay', towns: ['Homa Bay', 'Mbita', 'Oyugis', 'Kendu Bay', 'Magunga', 'Sori'] },
  { county: 'Isiolo', towns: ['Isiolo', 'Merti', 'Garbatulla', 'Oldonyiro', 'Kinna'] },
  { county: 'Kajiado', towns: ['Kajiado', 'Kitengela', 'Ongata Rongai', 'Ngong', 'Loitokitok', 'Namanga', 'Isinya'] },
  { county: 'Kakamega', towns: ['Kakamega', 'Butere', 'Mumias', 'Malava', 'Lugari', 'Shinyalu'] },
  { county: 'Kericho', towns: ['Kericho', 'Litein', 'Londiani', 'Kipkelion', 'Sigowet', 'Kapsuser'] },
  { county: 'Kiambu', towns: ['Kiambu', 'Ruiru', 'Thika', 'Limuru', 'Gatundu', 'Juja', 'Karuri', 'Githunguri', 'Kikuyu', 'Lari'] },
  { county: 'Kilifi', towns: ['Kilifi', 'Malindi', 'Watamu', 'Mariakani', 'Kaloleni', 'Rabai', 'Gongoni'] },
  { county: 'Kirinyaga', towns: ['Kerugoya', 'Wanguru', 'Kianyaga', 'Baricho', 'Kutus', 'Sagana'] },
  { county: 'Kisii', towns: ['Kisii', 'Suneka', 'Ogembo', 'Marani', 'Nyamache', 'Kenyenya'] },
  { county: 'Kisumu', towns: ['Kisumu', 'Maseno', 'Ahero', 'Kombewa', 'Katito', 'Muhoroni'] },
  { county: 'Kitui', towns: ['Kitui', 'Mwingi', 'Mutomo', 'Migwani', 'Ikutha', 'Kyuso'] },
  { county: 'Kwale', towns: ['Kwale', 'Ukunda', 'Diani', 'Msambweni', 'Kinango', 'Lungalunga'] },
  { county: 'Laikipia', towns: ['Nanyuki', 'Nyahururu', 'Rumuruti', 'Doldol', 'Wiyumiririe'] },
  { county: 'Lamu', towns: ['Lamu', 'Mpeketoni', 'Faza', 'Witu', 'Hindi'] },
  { county: 'Machakos', towns: ['Machakos', 'Athi River', 'Mavoko', 'Tala', 'Kangundo', 'Masii', 'Matuu', 'Yatta'] },
  { county: 'Makueni', towns: ['Wote', 'Emali', 'Kibwezi', 'Mbooni', 'Makindu', 'Kathonzweni'] },
  { county: 'Mandera', towns: ['Mandera', 'El Wak', 'Takaba', 'Lafey', 'Banissa'] },
  { county: 'Marsabit', towns: ['Marsabit', 'Moyale', 'Laisamis', 'North Horr', 'Loiyangalani'] },
  { county: 'Meru', towns: ['Meru', 'Maua', 'Chuka', 'Nkubu', 'Timau', 'Igoji', 'Laare'] },
  { county: 'Migori', towns: ['Migori', 'Rongo', 'Uriri', 'Awendo', 'Isebania', 'Suna'] },
  { county: 'Mombasa', towns: ['Mombasa Island', 'Nyali', 'Likoni', 'Changamwe', 'Kisauni', 'Jomvu'] },
  { county: "Murang'a", towns: ["Murang'a", 'Kangema', 'Maragua', 'Kandara', 'Kiharu', 'Gatanga'] },
  { county: 'Nairobi City', towns: ['Nairobi CBD', 'Westlands', 'Eastleigh', 'Karen', 'Rongai', 'Kasarani', 'Embakasi', 'Dagoretti', 'Ruaka', 'Gigiri'] },
  { county: 'Nakuru', towns: ['Nakuru', 'Naivasha', 'Gilgil', 'Molo', 'Njoro', 'Bahati', 'Subukia'] },
  { county: 'Nandi', towns: ['Kapsabet', 'Nandi Hills', 'Mosoriot', 'Kabiyet', 'Chepterit', 'Tinderet'] },
  { county: 'Narok', towns: ['Narok', 'Kilgoris', 'Sekenani', "Ololulung'a", 'Majengo'] },
  { county: 'Nyamira', towns: ['Nyamira', 'Keroka', 'Nyansiongo', 'Manga', 'Ekerenyo'] },
  { county: 'Nyandarua', towns: ['Ol Kalou', 'Nyahururu', 'Engineer', 'Ndaragwa', 'Mirangine'] },
  { county: 'Nyeri', towns: ['Nyeri', 'Karatina', 'Othaya', 'Mukurwe-ini', 'Mweiga', 'Endarasha'] },
  { county: 'Samburu', towns: ['Maralal', 'Baragoi', 'Archers Post', 'Wamba', 'Suguta Marmar'] },
  { county: 'Siaya', towns: ['Siaya', 'Bondo', 'Ugunja', 'Ukwala', 'Yala', 'Rarieda'] },
  { county: 'Taita-Taveta', towns: ['Voi', 'Wundanyi', 'Mwatate', 'Taveta', 'Mbololo'] },
  { county: 'Tana River', towns: ['Hola', 'Garsen', 'Madogo', 'Bura', 'Kipini'] },
  { county: 'Tharaka-Nithi', towns: ['Chuka', 'Kathwana', 'Marimanti', 'Chiakariga', 'Nkondi'] },
  { county: 'Trans Nzoia', towns: ['Kitale', 'Kiminini', 'Endebess', 'Saboti', 'Kachibora'] },
  { county: 'Turkana', towns: ['Lodwar', 'Lokichar', 'Kakuma', 'Lokichoggio', 'Kalokol', 'Kataboi'] },
  { county: 'Uasin Gishu', towns: ['Eldoret', 'Burnt Forest', 'Turbo', 'Moiben', 'Ziwa'] },
  { county: 'Vihiga', towns: ['Mbale', 'Hamisi', 'Luanda', 'Chavakali', 'Emuhaya'] },
  { county: 'Wajir', towns: ['Wajir', 'Habaswein', 'Griftu', 'Tarbaj', 'Eldas'] },
  { county: 'West Pokot', towns: ['Kapenguria', 'Sigor', 'Kacheliba', 'Alale', 'Chepareria'] },
];

/** All 47 counties, alphabetically, with sorted town lists. */
export const KENYAN_COUNTIES_AND_TOWNS: KenyanCountyTowns[] = [...RAW]
  .map(({ county, towns }) => ({
    county,
    towns: [...towns].sort((a, b) => a.localeCompare(b)),
  }))
  .sort((a, b) => a.county.localeCompare(b.county));

/** Suggested full address lines for client forms (town + county + Kenya). */
export const KENYAN_ADDRESS_SUGGESTIONS: string[] = KENYAN_COUNTIES_AND_TOWNS.flatMap(({ county, towns }) =>
  towns.map(town => `${town}, ${county} County, Kenya`)
);

export function getTownsForCounty(county: string): string[] {
  return KENYAN_COUNTIES_AND_TOWNS.find(c => c.county === county)?.towns ?? [];
}
