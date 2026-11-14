import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'rw';
const STORAGE_KEY = 'smartshop-pos-language';
export const translations: Record<string, string> = {
  'Save': 'Bika', 'Save changes': 'Bika impinduka', 'Cancel': 'Kureka', 'Close': 'Funga', 'Close form': 'Funga ifishi',
  'Add': 'Ongeraho', 'Add customer': 'Ongeraho umukiriya', 'Add staff': 'Ongeraho umukozi', 'Add branch': 'Ongeraho ishami', 'Add product': 'Ongeraho igicuruzwa', 'Add supplier': 'Ongeraho ugurisha',
  'Edit': 'Hindura', 'Delete': 'Siba', 'Remove': 'Kuraho', 'Search': 'Shakisha', 'Search…': 'Shakisha…', 'Loading…': 'Birimo gutegurwa…',
  'Name': 'Izina', 'Customer name': 'Izina ry’umukiriya', 'Phone': 'Telefoni', 'Email': 'Imeyili', 'Notes': 'Ibisobanuro', 'Address': 'Aderesi', 'Category': 'Icyiciro', 'Price': 'Igiciro', 'Quantity': 'Ingano', 'Amount': 'Amafaranga', 'Payment method': 'Uburyo bwo kwishyura', 'Actions': 'Ibikorwa', 'Status': 'Imiterere', 'Date': 'Itariki', 'Total': 'Igiteranyo', 'Paid': 'Yishyuwe', 'Balance': 'Umwenda',
  'No notes': 'Nta bisobanuro', 'No results found.': 'Nta bisubizo bibonetse.', 'No customers found.': 'Nta bakiriya babonetse.', 'Saving…': 'Birimo kubikwa…', 'Submitting…': 'Birimo koherezwa…', 'Record payment': 'Bika ubwishyu', 'Record supplier payment': 'Bika ubwishyu bw’ugurisha', 'Receive stock': 'Akira ibicuruzwa', 'Go back': 'Subira inyuma', 'Print': 'Sohora',
  'Customer': 'Umukiriya', 'Supplier': 'Ugurisha', 'Product': 'Igicuruzwa', 'Branch': 'Ishami', 'Cash': 'Amafaranga mu ntoki', 'Bank card': 'Ikarita ya banki', 'Bank transfer': 'Kohereza kuri banki', 'Customer credit': 'Ideni ry’umukiriya', 'Complete sale': 'Emeza igurisha',
  'Visits': 'Inshuro yasuye', 'Total spent': 'Amafaranga yakoresheje', 'Credit due': 'Umwenda', 'Last purchase': 'Icyo aheruka kugura', 'Contact': 'Aho abarizwa', 'Receipt': 'Inyemezabwishyu', 'Invoice': 'Fagitire',
  'Supplier payment': 'Ubwishyu bw’ugurisha', 'Outstanding balance': 'Umwenda usigaye', 'Amount paid': 'Amafaranga yishyuwe', 'Reference (optional)': 'Nimero y’inyandiko (si ngombwa)', 'Confirm': 'Emeza', 'Save customer': 'Bika umukiriya',
  'Register category': 'Andika icyiciro', 'Create a category to keep your product catalog organized.': 'Kora icyiciro cyo gutunganya urutonde rw’ibicuruzwa.', 'Category name': 'Izina ry’icyiciro', 'Create category': 'Kora icyiciro', 'Edit product…': 'Hindura igicuruzwa…', 'Add category': 'Ongeraho icyiciro',
  'Search products by name or SKU': 'Shakisha ibicuruzwa ukoresheje izina cyangwa kode', 'Search name, phone, or email': 'Shakisha izina, telefoni cyangwa imeyili', 'Search supplier or order': 'Shakisha ugurisha cyangwa ibyo waguze', 'Search products': 'Shakisha ibicuruzwa',
  'Receipt / date': 'Inyemezabwishyu / itariki', 'Items / payment': 'Ibicuruzwa / ubwishyu', 'Documents': 'Inyandiko', 'Balance due': 'Umwenda usigaye', 'Recent sales': 'Ibyagurishijwe vuba', 'No sales recorded yet.': 'Nta gurisha rirandikwa.', 'No in-stock products found.': 'Nta bicuruzwa biri mu bubiko bibonetse.', 'Products available': 'Ibicuruzwa bihari', 'Exact amount': 'Amafaranga nyayo',
  'Menu items': 'Ibyokurya biri kuri menu', 'Dining tables': 'Ameza yo kuriraho', 'Open orders': 'Amabwiriza afunguye', 'Tables': 'Ameza', 'Kitchen orders': 'Amabwiriza yo mu gikoni', 'Menu': 'Menu', 'Add table': 'Ongeraho ameza', 'Menu item': 'Icyo kuri menu', 'Capacity': 'Ubushobozi',
  'Overview': 'Incamake', 'Connected': 'Byahujwe', 'Checking': 'Birimo kugenzurwa', 'No products found.': 'Nta bicuruzwa bibonetse.', 'No records yet.': 'Nta makuru arahari.',
  'Sales performance': 'Uko igurisha rihagaze', 'Revenue': 'Amafaranga yinjiye', 'Gross profit': 'Inyungu rusange', 'Net profit': 'Inyungu isigara', 'Expenses': 'Amafaranga yakoreshejwe', 'Transactions': 'Ibikorwa', 'From': 'Kuva', 'To': 'Kugeza',
  'Search the help center': 'Shakisha mu bufasha', 'e.g. Beverages': 'urugero: Ibinyobwa', 'e.g. 20': 'urugero: 20', 'Delivery, correction, damage…': 'Ibyakiriwe, ikosora cyangwa ibyangiritse…', 'Example: H-frame scaffold': 'Urugero: H-frame scaffold', 'Example: SCAF-HF': 'Urugero: SCAF-HF', 'Available stock': 'Ibiri mu bubiko', 'Aho bigiye (site location)': 'Aho bijyanywe (ahakorerwa)', 'Driver or vehicle details': 'Amakuru y’umushoferi cyangwa imodoka', 'Damage, missing accessory, cleaning, or late fee': 'Ibyangiritse, ibibuze, isuku cyangwa amafaranga y’ubukererwe', 'Confirm frames, braces, jacks, wheels, boards, couplers, ladders, damage, and missing quantities.': 'Emeza ibikoresho, ibyangiritse n’ingano ibuze.', 'Transaction ID or receipt reference': 'Nimero y’igikorwa cyangwa inyemezabwishyu', 'Search orders': 'Shakisha ibyo waguze', 'e.g. KGL-02': 'urugero: KGL-02', 'Defaults to company name': 'Izina ry’ikigo ni ryo rikoreshwa', 'name@company.com': 'izina@ikigo.com', 'Enter your password': 'Andika ijambo ry’ibanga', '8+ characters': 'Inyuguti 8 cyangwa zirenga', 'Today': 'Uyu munsi', 'This month': 'Uku kwezi', 'Generate report': 'Kora raporo', 'All branches': 'Amashami yose'
};
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>(() => window.localStorage.getItem(STORAGE_KEY) === 'rw' ? 'rw' : 'en');
  const value = useMemo(() => ({ language, setLanguage: (next: Language) => { window.localStorage.setItem(STORAGE_KEY, next); setCurrentLanguage(next); } }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return { ...context, t: (text: string) => context.language === 'rw' ? translations[text] ?? text : text };
}
