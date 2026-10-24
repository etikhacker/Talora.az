'use client';

import { PageHeading } from '@/components/layout/page-heading';
import React, { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/i18n/language-context';
import { submitContactMessage } from '@/lib/contact/service';
import { Mail, MapPin, Phone, Send, CheckCircle2 } from 'lucide-react';

const CONTACT_EMAIL = 'babayev.omr.23@gmail.com';

export default function ContactPage() {
  const { language } = useLanguage();
  const isAz = language === 'az';

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await submitContactMessage(formData);
      if (!result.success) {
        setServerError(result.error || 'Mesaj göndərilmədi.');
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError('Mesaj göndərilərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main id="main-content" className="flex-1 public-main">
        <div className="content-width">
          <PageHeading eyebrow={isAz ? 'BİZİMLƏ ƏLAQƏ' : 'GET IN TOUCH'} title={isAz ? 'Səni dinləyirik.' : 'We’re here to listen.'} description={isAz ? 'Proqram, müraciət və ya platforma haqqında sualın var? Bizə yaz.' : 'Have a question about a program, your application or the platform? Send us a message.'} />

          <div className="contact-columns">
            {/* Contact Details */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isAz ? 'Ünvan' : 'Location'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-11">
                  Mingəçevir şəhəri, Azərbaycan
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isAz ? 'E-poçt' : 'Email Support'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-11">
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-emerald-700 transition-colors">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Phone className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isAz ? 'Əlaqə Nömrəsi' : 'Phone'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-11">
                  <a href="tel:+994706449222" className="hover:text-emerald-700 transition-colors">
                    +994 70 644 92 22
                  </a>
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="public-panel contact-form">
              {serverError && (
                <Alert variant="destructive" className="mb-4 text-xs">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              {submitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {isAz ? 'Mesajınız göndərildi!' : 'Message sent!'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isAz
                      ? 'Mesajınız uğurla göndərildi. Tezliklə cavablandıracağıq.'
                      : 'Your message was submitted successfully. We will respond shortly.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setServerError(null);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="mt-4"
                  >
                    {isAz ? 'Yeni mesaj göndər' : 'Send Another Message'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name" className="text-xs font-semibold text-slate-700">
                        {isAz ? 'Ad və Soyad' : 'Full Name'}
                      </Label>
                      <Input
                        id="contact-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={isAz ? 'məs. Rəşad Əliyev' : 'e.g. Rashad Aliyev'}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-xs font-semibold text-slate-700">
                        {isAz ? 'E-poçt ünvanı' : 'Email Address'}
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ad@example.com"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contact-subject" className="text-xs font-semibold text-slate-700">
                      {isAz ? 'Mövzu' : 'Subject'}
                    </Label>
                    <Input
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={isAz ? 'Müraciət haqqında sual' : 'Internship cohort inquiry'}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-msg" className="text-xs font-semibold text-slate-700">
                      {isAz ? 'Mesajınız' : 'Message'}
                    </Label>
                    <Textarea
                      id="contact-msg"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={isAz ? 'Mesajınızı buraya yazın...' : 'How can we help you?'}
                      className="mt-1"
                      required
                    />
                  </div>

                  <Button type="submit" className="gap-2 shadow-xs" disabled={isSubmitting}>
                    <Send className="w-4 h-4" />
                    {isSubmitting ? (isAz ? 'Göndərilir...' : 'Sending...') : (isAz ? 'Mesajı Göndər' : 'Send Message')}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
