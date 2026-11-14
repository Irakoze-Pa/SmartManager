import { useLanguage } from './LanguageContext';

export function LocalizedText({ text }: { text: string }) {
  const { t } = useLanguage();
  return <>{t(text)}</>;
}
