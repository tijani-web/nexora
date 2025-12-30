'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { Globe, Moon, Sun, Monitor, Construction, Shield, Bell, Mail, ArrowLeft, Languages } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Simple language texts - we'll just change THIS PAGE for demo
const LANGUAGE_TEXTS = {
  en: {
    title: "Settings",
    description: "Customize your Nexora experience",
    appearance: "Appearance", 
    appearanceDesc: "Customize how Nexora looks and feels",
    theme: "Theme",
    language: "Language",
    privacy: "Privacy & Security",
    privacyDesc: "Control your privacy settings and security preferences",
    notifications: "Notifications", 
    notificationsDesc: "Manage your notification preferences",
    email: "Email Preferences",
    emailDesc: "Control the emails you receive from Nexora",
    light: "Light",
    dark: "Dark", 
    system: "System",
    comingSoon: "Coming Soon",
    privacyText: "Manage your data privacy, visibility settings, and security preferences. Full privacy controls coming in the next update.",
    profileVisibility: "Profile Visibility",
    profileVisibilityDesc: "Control who sees your profile",
    dataPrivacy: "Data Privacy",
    dataPrivacyDesc: "Manage your personal data", 
    security: "Security",
    securityDesc: "Two-factor authentication",
    activityPrivacy: "Activity Privacy",
    activityPrivacyDesc: "Control activity visibility",
    notificationCenter: "Notification Center",
    notificationText: "Customize how and when you receive notifications from Nexora.",
    emailText: "Email preference controls will be available soon!",
    themeChanged: "Theme changed to {{theme}}",
    languageChanged: "Language changed to {{language}}",
    back: "Back"
  },
  es: {
    title: "Configuración",
    description: "Personaliza tu experiencia en Nexora", 
    appearance: "Apariencia",
    appearanceDesc: "Personaliza cómo se ve y se siente Nexora",
    theme: "Tema",
    language: "Idioma",
    privacy: "Privacidad y Seguridad",
    privacyDesc: "Controla tu configuración de privacidad y preferencias de seguridad",
    notifications: "Notificaciones",
    notificationsDesc: "Gestiona tus preferencias de notificaciones", 
    email: "Preferencias de Email",
    emailDesc: "Controla los correos electrónicos que recibes de Nexora",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema", 
    comingSoon: "Próximamente",
    privacyText: "Gestiona tu privacidad de datos, configuración de visibilidad y preferencias de seguridad. Controles de privacidad completos en la próxima actualización.",
    profileVisibility: "Visibilidad del Perfil",
    profileVisibilityDesc: "Controla quién ve tu perfil", 
    dataPrivacy: "Privacidad de Datos",
    dataPrivacyDesc: "Gestiona tus datos personales",
    security: "Seguridad",
    securityDesc: "Autenticación de dos factores",
    activityPrivacy: "Privacidad de Actividad",
    activityPrivacyDesc: "Controla la visibilidad de la actividad", 
    notificationCenter: "Centro de Notificaciones",
    notificationText: "Personaliza cómo y cuándo recibes notificaciones de Nexora.",
    emailText: "Los controles de preferencias de correo electrónico estarán disponibles pronto!",
    themeChanged: "Tema cambiado a {{theme}}",
    languageChanged: "Idioma cambiado a {{language}}",
    back: "Atrás"
  },
  fr: {
    title: "Paramètres",
    description: "Personnalisez votre expérience Nexora",
    appearance: "Apparence",
    appearanceDesc: "Personnalisez l'apparence et la sensation de Nexora", 
    theme: "Thème",
    language: "Langue",
    privacy: "Confidentialité et Sécurité",
    privacyDesc: "Contrôlez vos paramètres de confidentialité et préférences de sécurité",
    notifications: "Notifications",
    notificationsDesc: "Gérez vos préférences de notifications", 
    email: "Préférences d'Email",
    emailDesc: "Contrôlez les emails que vous recevez de Nexora",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
    comingSoon: "Bientôt disponible", 
    privacyText: "Gérez votre confidentialité des données, paramètres de visibilité et préférences de sécurité. Contrôles de confidentialité complets dans la prochaine mise à jour.",
    profileVisibility: "Visibilité du Profil",
    profileVisibilityDesc: "Contrôlez qui voit votre profil",
    dataPrivacy: "Confidentialité des Données", 
    dataPrivacyDesc: "Gérez vos données personnelles",
    security: "Sécurité",
    securityDesc: "Authentification à deux facteurs",
    activityPrivacy: "Confidentialité de l'Activité",
    activityPrivacyDesc: "Contrôlez la visibilité de l'activité", 
    notificationCenter: "Centre de Notifications",
    notificationText: "Personnalisez comment et quand vous recevez des notifications de Nexora.",
    emailText: "Les contrôles de préférences d'email seront bientôt disponibles!",
    themeChanged: "Thème changé en {{theme}}", 
    languageChanged: "Langue changée en {{language}}",
    back: "Retour"
  }
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
]

export default function SettingsPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(theme)
  const [currentLanguage, setCurrentLanguage] = useState('en')

  // Get texts for current language
  const t = (key: string, params?: any) => {
    const text = LANGUAGE_TEXTS[currentLanguage as keyof typeof LANGUAGE_TEXTS]?.[key as keyof typeof LANGUAGE_TEXTS['en']] || 
                 LANGUAGE_TEXTS.en[key as keyof typeof LANGUAGE_TEXTS['en']] || 
                 key
    
    if (params) {
      return text.replace(/{{(\w+)}}/g, (_, param) => params[param] || '')
    }
    return text
  }

  useEffect(() => {
    setCurrentTheme(theme)
    const savedLang = localStorage.getItem('nexora-language') || 'en'
    setCurrentLanguage(savedLang)
  }, [theme])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(newTheme)
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const actualTheme = systemPrefersDark ? 'dark' : 'light'
      
      if (actualTheme !== theme) {
        toggleTheme()
      }
    } else {
      if (newTheme !== theme) {
        toggleTheme()
      }
    }
    toast.success(t('themeChanged', { theme: t(newTheme) }))
  }

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage)
    localStorage.setItem('nexora-language', newLanguage)
    
    // Show instant change - this page updates immediately!
    toast.success(t('languageChanged', { language: LANGUAGES.find(l => l.code === newLanguage)?.name }))
  }

  const handleBack = () => {
    router.push('/')
  }

  const getCurrentLanguage = () => {
    return LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0]
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Breadcrumbs Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2 px-2 sm:px-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('back')}</span>
        </Button>
        <div className="h-4 w-px bg-border"></div>
        <span className="text-sm text-muted-foreground">{t('title')}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {t('description')}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Languages className="h-3 w-3 sm:h-4 sm:w-4" />
              {getCurrentLanguage().name}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="capitalize text-xs sm:text-sm">{currentTheme} Mode</span>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('appearance')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('appearanceDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Theme Selection with Boxes */}
          <div>
            <label className="font-medium block mb-3 text-sm sm:text-base">{t('theme')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div 
                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentTheme === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleThemeChange('light')}
              >
                <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm space-y-1 sm:space-y-2 mb-2 sm:mb-3">
                  <div className="flex gap-1 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="h-1 sm:h-2 bg-gray-200 rounded"></div>
                  <div className="h-1 sm:h-2 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 sm:h-6 bg-blue-500 rounded mt-1 sm:mt-2"></div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 justify-center">
                  <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-medium text-xs sm:text-sm">{t('light')}</span>
                </div>
              </div>
              
              <div 
                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentTheme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 shadow-sm space-y-1 sm:space-y-2 mb-2 sm:mb-3">
                  <div className="flex gap-1 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="h-1 sm:h-2 bg-gray-700 rounded"></div>
                  <div className="h-1 sm:h-2 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 sm:h-6 bg-blue-600 rounded mt-1 sm:mt-2"></div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 justify-center">
                  <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-medium text-xs sm:text-sm">{t('dark')}</span>
                </div>
              </div>
              
              <div 
                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentTheme === 'system' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleThemeChange('system')}
              >
                <div className="bg-gradient-to-r from-white to-gray-900 rounded-lg p-2 sm:p-3 shadow-sm space-y-1 sm:space-y-2 mb-2 sm:mb-3">
                  <div className="flex gap-1 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="h-1 sm:h-2 bg-gray-400 rounded"></div>
                  <div className="h-1 sm:h-2 bg-gray-400 rounded w-3/4"></div>
                  <div className="h-4 sm:h-6 bg-blue-500 rounded mt-1 sm:mt-2"></div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 justify-center">
                  <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-medium text-xs sm:text-sm">{t('system')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="font-medium text-sm sm:text-base">{t('language')}</label>
              <p className="text-xs sm:text-sm text-muted-foreground">Choose your preferred language</p>
            </div>
            <Select
              value={currentLanguage}
              onValueChange={(value: string) => handleLanguageChange(value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base">{getCurrentLanguage().flag}</span>
                  <span className="text-sm sm:text-base">{getCurrentLanguage().name}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">{lang.flag}</span>
                      <span className="text-sm sm:text-base">{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security Section */}
      <Card className="opacity-60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('privacy')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('privacyDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-12 text-muted-foreground">
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">{t('privacy')}</h3>
            <p className="max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base">
              {t('privacyText')}
            </p>
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm max-w-md mx-auto">
              <div className="text-left p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">{t('profileVisibility')}</div>
                <div className="text-xs mt-1">{t('profileVisibilityDesc')}</div>
              </div>
              <div className="text-left p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">{t('dataPrivacy')}</div>
                <div className="text-xs mt-1">{t('dataPrivacyDesc')}</div>
              </div>
              <div className="text-left p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">{t('security')}</div>
                <div className="text-xs mt-1">{t('securityDesc')}</div>
              </div>
              <div className="text-left p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">{t('activityPrivacy')}</div>
                <div className="text-xs mt-1">{t('activityPrivacyDesc')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card className="opacity-60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('notifications')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('notificationsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-12 text-muted-foreground">
            <Bell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">{t('notificationCenter')}</h3>
            <p className="max-w-md mx-auto mb-4 text-sm sm:text-base">
              {t('notificationText')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Preferences Section */}
      <Card className="opacity-60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('email')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('emailDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-12 text-muted-foreground">
            <Mail className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">{t('email')}</h3>
            <p className="max-w-md mx-auto text-sm sm:text-base">
              {t('emailText')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}