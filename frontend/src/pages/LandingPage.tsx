import { Link } from 'react-router-dom';
import { MessageCircle, Zap, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 lg:py-32">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {t('hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('hero.subtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base px-8">
                  <Link to="/chat">
                    <MessageCircle className="me-2 h-5 w-5" />
                    {t('hero.cta.primary')}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-base px-8">
                  {t('hero.cta.secondary')}
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="w-32 h-32 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -end-4 w-20 h-20 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="absolute -bottom-6 -start-6 w-24 h-24 bg-green-400/20 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-slate-100/50 dark:bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('features.intelligent.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('features.intelligent.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('features.fast.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('features.fast.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('features.secure.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('features.secure.description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('features.multilingual.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('features.multilingual.description')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-red-600 dark:bg-red-400 rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('features.available.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('features.available.description')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-teal-600 dark:bg-teal-400 rounded-lg"></div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('features.customizable.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('features.customizable.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* About Image */}
            <div className="relative order-2 lg:order-1">
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="grid grid-cols-2 gap-4 p-8">
                  <div className="w-24 h-24 bg-purple-500/20 rounded-2xl"></div>
                  <div className="w-24 h-24 bg-pink-500/20 rounded-2xl"></div>
                  <div className="w-24 h-24 bg-blue-500/20 rounded-2xl"></div>
                  <div className="w-24 h-24 bg-green-500/20 rounded-2xl"></div>
                </div>
              </div>
            </div>

            {/* About Text */}
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
                {t('about.title')}
              </h2>
              <div className="space-y-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>{t('about.paragraph1')}</p>
                <p>{t('about.paragraph2')}</p>
              </div>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-8"
              >
                <Link to="/chat">{t('about.cta')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-slate-900 dark:bg-slate-950">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <Button
              asChild
              size="lg"
              className="text-base px-8 bg-white text-slate-900 hover:bg-slate-100"
            >
              <Link to="/chat">
                <MessageCircle className="me-2 h-5 w-5" />
                {t('cta.button')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
