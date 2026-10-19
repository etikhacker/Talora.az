'use client';

import React, { createContext, useContext, useState } from 'react';

export type Language = 'az' | 'en';

export interface Translations {
  navHome: string;
  navInternships: string;
  navHowItWorks: string;
  navAbout: string;
  navContact: string;
  navLogin: string;
  navRegister: string;
  navDashboard: string;
  navLogout: string;
  
  // Footer
  footerDesc: string;
  footerPlatform: string;
  footerRights: string;
  footerBaku: string;
  privacy: string;
  terms: string;

  // Generic
  emptyInternships: string;
  emptyApplications: string;
  emptyTasks: string;
  emptySubmissions: string;
  emptyNotifications: string;
  generalError: string;
  retry: string;

  // Internships Public
  internshipsTitle: string;
  internshipsSubtitle: string;
  searchPlaceholder: string;
  allCategories: string;
  allDifficulties: string;
  filterResults: string;
  clearFilters: string;
  durationWeeks: string;
  skills: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  maxStudents: string;
  placesAvailable: string;
  placesFull: string;
  applicationDeadline: string;
  startDate: string;
  viewDetails: string;
  applyNow: string;
  loginToApply: string;
  alreadyApplied: string;
  alreadyParticipating: string;
  applicationsClosed: string;
  deadlinePassed: string;
  backToInternships: string;
  difficultyBeginner: string;
  difficultyIntermediate: string;
  difficultyAdvanced: string;

  // Applications
  applyTitle: string;
  applySubtitle: string;
  studentInfo: string;
  motivationLabel: string;
  motivationPlaceholder: string;
  experienceLabel: string;
  experiencePlaceholder: string;
  portfolioLabel: string;
  githubLabel: string;
  linkedinLabel: string;
  submitApplication: string;
  submitting: string;
  applicationSuccess: string;
  applicationSuccessDesc: string;
  emailSpamFolderNotice: string;

  // Student Applications & Status
  myApplicationsTitle: string;
  myApplicationsSubtitle: string;
  noApplications: string;
  statusPending: string;
  statusAccepted: string;
  statusRejected: string;
  statusWithdrawn: string;
  withdrawApplication: string;
  withdrawConfirm: string;
  appliedOn: string;
  lastUpdated: string;
  adminNoteLabel: string;

  // Student Active Internship
  activeInternshipTitle: string;
  activeInternshipSubtitle: string;
  noActiveInternship: string;
  noActiveInternshipDesc: string;
  tasksPlaceholder: string;
  programOverview: string;
  programDetails: string;

  // Admin
  adminInternshipsTitle: string;
  adminInternshipsSubtitle: string;
  createNewInternship: string;
  editInternship: string;
  adminApplicationsTitle: string;
  adminApplicationsSubtitle: string;
  reviewApplicationTitle: string;
  accept: string;
  reject: string;
  acceptConfirm: string;
  rejectConfirm: string;
  capacityReached: string;
  manageProgram: string;

  // Certificates & Payments (Phase 4)
  certificate: string;
  certificateSubtitle: string;
  certificatePayment: string;
  certificatePrice: string;
  paymentCardNumber: string;
  copyCardNumber: string;
  cardNumberCopied: string;
  paymentM10Number: string;
  copyM10Number: string;
  m10NumberCopied: string;
  uploadReceipt: string;
  uploadReceiptDesc: string;
  submitPayment: string;
  paymentPending: string;
  paymentApproved: string;
  paymentRejected: string;
  certificatePreparing: string;
  certificateIssued: string;
  certificateRevoked: string;
  certificateId: string;
  issuedDate: string;
  viewCertificate: string;
  downloadCertificate: string;
  verifyCertificate: string;
  notEligibleTitle: string;
  notEligibleDesc: string;
  paymentUnderReviewDesc: string;
  paymentApprovedDesc: string;
  paymentRejectedDesc: string;
  publicVerifySuccess: string;
  publicVerifyNotice: string;
  publicVerifyNotFound: string;
  certificateSettings: string;
  certificateOrders: string;
  certificatesRegistry: string;
  candidateAwaitingCert: string;
  uploadPdfCertificate: string;
  revokeCertificate: string;
  revokeConfirm: string;

  // Student Settings
  settingsTitle: string;
  settingsSubtitle: string;
  settingsSaved: string;
  interfaceLanguage: string;
  interfaceLanguageDesc: string;
  languageAzLabel: string;
  languageEnLabel: string;
  notificationSettings: string;
  notificationSettingsDesc: string;
  notifNewInternships: string;
  notifNewInternshipsDesc: string;
  notifApplicationStatus: string;
  notifApplicationStatusDesc: string;
  saveBtn: string;
  settingsSaving: string;
  settingsErrorViewAuth: string;
  settingsErrorNoDb: string;
  settingsErrorLoadFailed: string;
  settingsErrorSession: string;
  settingsErrorSaveAuth: string;
  settingsErrorSaveGeneric: string;

  // Auth — shared
  authBackHome: string;
  authPortalSubtitle: string;
  authStatPrograms: string;
  authStatTasks: string;
  authStatWeeks: string;
  authEmail: string;
  authPassword: string;
  authPasswordMin: string;
  authShowPassword: string;
  authHidePassword: string;
  authFooter: string;
  authLoadingLogin: string;
  authLangLabel: string;

  // Auth — login
  authLoginBadge: string;
  authLoginHeadline: string;
  authLoginSubline: string;
  authLoginBullet1: string;
  authLoginBullet2: string;
  authLoginBullet3: string;
  authLoginTitle: string;
  authLoginSubtitle: string;
  authForgotPassword: string;
  authRememberMe: string;
  authSignIn: string;
  authSigningIn: string;
  authNoAccount: string;
  authFreeRegister: string;
  authNoticeAdmin: string;
  authNoticeSetup: string;
  authNoticeUnavailable: string;
  authNoticeRedirect: string;
  authErrorCredentials: string;

  // Auth — register
  authRegisterBadge: string;
  authRegisterHeadline: string;
  authRegisterSubline: string;
  authRegisterBullet1: string;
  authRegisterBullet2: string;
  authRegisterBullet3: string;
  authRegisterFormBadge: string;
  authRegisterTitle: string;
  authRegisterSubtitle: string;
  authFullName: string;
  authFullNamePlaceholder: string;
  authUniversity: string;
  authUniversityPlaceholder: string;
  authTerms: string;
  authPrivacy: string;
  authAgreeSuffix: string;
  authRegisterSuccess: string;
  authRegisterConfirmEmail: string;
  authErrorAgree: string;
  authErrorRegister: string;
  authCreateAccount: string;
  authCreating: string;
  authHaveAccount: string;
  authQuote: string;
  authQuoteAuthor: string;
  authQuoteMeta: string;

  // Student sidebar
  sideStudentPortal: string;
  sideStudentFallback: string;
  sideStudentUniversityFallback: string;
  sideStudentBadge: string;
  sideStudentMenu: string;
  sideStudentSignOut: string;
  sideDashboard: string;
  sideInternships: string;
  sideMyApplications: string;
  sideMyInternship: string;
  sideTasks: string;
  sideSubmissions: string;
  sideCertificate: string;
  sideNotifications: string;
  sideProfile: string;
  sideSettings: string;

  // Admin sidebar
  sideAdminPanel: string;
  sideAdminFallback: string;
  sideAdminBadge: string;
  sideAdminMenu: string;
  sideAdminSignOut: string;
  sideAdminMobile: string;
  sideAdminOverview: string;
  sideAdminInternships: string;
  sideAdminApplications: string;
  sideAdminStudents: string;
  sideAdminCompleted: string;
  sideAdminCertOrders: string;
  sideAdminCertificates: string;
  sideAdminCertSettings: string;
  sideAdminContact: string;
}

const translations: Record<Language, Translations> = {
  az: {
    navHome: 'Ana səhifə',
    navInternships: 'Təcrübələr',
    navHowItWorks: 'Necə işləyir?',
    navAbout: 'Haqqımızda',
    navContact: 'Əlaqə',
    navLogin: 'Daxil ol',
    navRegister: 'Qeydiyyat',
    navDashboard: 'Dashboard',
    navLogout: 'Çıxış',

    footerDesc: 'Azərbaycan tələbələri üçün praktiki təcrübə proqramları, real layihələr və rəsmi sertifikatlaşdırma platforması.',
    footerPlatform: 'Platforma',
    footerRights: 'Bütün hüquqlar qorunur.',
    footerBaku: 'Mingəçevir, Azərbaycan',
    privacy: 'Məxfilik siyasəti',
    terms: 'İstifadə qaydaları',

    emptyInternships: 'Hazırda aktiv təcrübə proqramı yoxdur.',
    emptyApplications: 'Hazırda aktiv müraciətiniz yoxdur.',
    emptyTasks: 'Təyin olunmuş aktiv tapşırıq yoxdur.',
    emptySubmissions: 'Hələ heç bir təqdimat göndərilməyib.',
    emptyNotifications: 'Yeni bildiriş yoxdur.',
    generalError: 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
    retry: 'Yenidən cəhd edin',

    internshipsTitle: 'Təcrübə Proqramları',
    internshipsSubtitle: 'Azərbaycanın aparıcı şirkət və sənaye standartlarına uyğun açıq təcrübə vakansiyaları.',
    searchPlaceholder: 'Vakansiya, texnologiya və ya bacarıq axtarın...',
    allCategories: 'Bütün istiqamətlər',
    allDifficulties: 'Bütün çətinliklər',
    filterResults: 'Filter nəticələri',
    clearFilters: 'Filterləri sıfırla',
    durationWeeks: 'həftə',
    skills: 'Tələb olunan bacarıqlar',
    requirements: 'Qəbul tələbləri',
    responsibilities: 'Öhdəliklər və fəaliyyət',
    benefits: 'Təcrübənin üstünlükləri',
    maxStudents: 'Maksimum yer',
    placesAvailable: 'yer mövcuddur',
    placesFull: 'Bu təcrübə proqramında boş yer qalmayıb',
    applicationDeadline: 'Son müraciət tarixi',
    startDate: 'Başlama tarixi',
    viewDetails: 'Ətraflı bax',
    applyNow: 'Müraciət et',
    loginToApply: 'Müraciət etmək üçün daxil olun',
    alreadyApplied: 'Bu proqrama artıq müraciət etmisiniz',
    alreadyParticipating: 'Bu proqramda iştirak edirsiniz',
    applicationsClosed: 'Müraciətlər bağlıdır',
    deadlinePassed: 'Müraciət müddəti başa çatıb',
    backToInternships: 'Bütün təcrübə proqramlarına qayıt',
    difficultyBeginner: 'Başlanğıc',
    difficultyIntermediate: 'Orta',
    difficultyAdvanced: 'İrəli səviyyə',

    applyTitle: 'Təcrübəyə Müraciət',
    applySubtitle: 'Tələbə məlumatlarınızı təsdiqləyin və motivasiya məktubunuzu təqdim edin.',
    studentInfo: 'Tələbə Məlumatları',
    motivationLabel: 'Motivasiya Məktubu',
    motivationPlaceholder: 'Niyə bu təcrübə proqramına qoşulmaq istədiyinizi, karyera məqsədlərinizi və öyrənmək istədiyiniz sahələri qeyd edin (minimum 50 simvol)...',
    experienceLabel: 'Əvvəlki Təcrübə və Layihələr (Könüllü)',
    experiencePlaceholder: 'Əvvəl iştirak etdiyiniz layihələr, təhsil işləri və ya təlimlər barədə qısa məlumat verin...',
    portfolioLabel: 'Şəxsi Vebsayt / Portfel URL (Könüllü)',
    githubLabel: 'GitHub Profili (Könüllü)',
    linkedinLabel: 'LinkedIn Profili (Könüllü)',
    submitApplication: 'Müraciəti təsdiqlə və göndər',
    submitting: 'Göndərilir...',
    applicationSuccess: 'Müraciətiniz uğurla göndərildi!',
    applicationSuccessDesc: 'Müraciətiniz nəzərdən keçiriləcək. Statusu şəxsi kabinetinizdən izləyə bilərsiniz.',
    emailSpamFolderNotice: 'E-poçt bildirişləri aktivdirsə, Talora-dan gələn məktublar bildiriş e-poçtunuzdan göndərilir. Gələnlər qutusunda görünməsə, Spam qovluğunu yoxlayın.',

    myApplicationsTitle: 'Müraciətlərim',
    myApplicationsSubtitle: 'Göndərdiyiniz təcrübə müraciətlərinin cari vəziyyəti və qərarlar.',
    noApplications: 'Hələ heç bir təcrübə proqramına müraciət etməmisiniz.',
    statusPending: 'Gözləmədə',
    statusAccepted: 'Qəbul edildi',
    statusRejected: 'Rədd edildi',
    statusWithdrawn: 'Geri çəkildi',
    withdrawApplication: 'Müraciəti geri çək',
    withdrawConfirm: 'Bu müraciəti geri çəkmək istədiyinizə əminsiniz?',
    appliedOn: 'Müraciət tarixi',
    lastUpdated: 'Son yenilənmə',
    adminNoteLabel: 'İnzibatçı rəyi / Qeyd',

    activeInternshipTitle: 'Mənim Təcrübəm',
    activeInternshipSubtitle: 'Qoşulduğunuz aktiv təcrübə proqramı, plan və gedişat.',
    noActiveInternship: 'Hazırda aktiv təcrübə proqramınız yoxdur.',
    noActiveInternshipDesc: 'Təcrübə proqramına qəbul edildikdən sonra proqram planı, modullar və tapşırıqlar burada aktivləşəcəkdir.',
    tasksPlaceholder: 'Tapşırıqlarınız burada görünəcək.',
    programOverview: 'Proqram Haqqında',
    programDetails: 'Təfərrüatlar',

    adminInternshipsTitle: 'Təcrübə Proqramları İdarəetməsi',
    adminInternshipsSubtitle: 'Yeni təcrübə proqramları yaradın, redaktə edin və statuslarını dəyişin.',
    createNewInternship: 'Yeni Təcrübə Yarat',
    editInternship: 'Proqramı Redaktə Et',
    adminApplicationsTitle: 'Tələbə Müraciətləri',
    adminApplicationsSubtitle: 'Daxil olan tələbə müraciətlərini nəzərdən keçirin, qəbul və ya rədd edin.',
    reviewApplicationTitle: 'Müraciətin İcmalı',
    accept: 'Qəbul et',
    reject: 'Rədd et',
    acceptConfirm: 'Bu tələbəni təcrübə proqramına qəbul etmək istəyirsiniz?',
    rejectConfirm: 'Bu müraciəti rədd etmək istəyirsiniz?',
    capacityReached: 'Bu təcrübə proqramında boş yer qalmayıb.',
    manageProgram: 'Bu proqramı idarə et',

    // Phase 4 Translations (AZ)
    certificate: 'Sertifikat',
    certificateSubtitle: 'Rəsmi təcrübə sertifikatınız, ödəniş statusu və verifikasiya məlumatları.',
    certificatePayment: 'Sertifikat ödənişi',
    certificatePrice: 'Qiymət',
    paymentCardNumber: 'Ödəniş üçün kart',
    copyCardNumber: 'Kart nömrəsini kopyala',
    cardNumberCopied: 'Kopyalandı!',
    paymentM10Number: 'M10 qəbul nömrəsi',
    copyM10Number: 'M10 nömrəsini kopyala',
    m10NumberCopied: 'M10 nömrəsi kopyalandı!',
    uploadReceipt: 'Ödəniş qəbzi',
    uploadReceiptDesc: 'Bank və ya mobil tətbiqdən ödəniş qəbzini (JPG, PNG, PDF) yükləyin.',
    submitPayment: 'Qəbzi göndər',
    paymentPending: 'Ödəniş yoxlanılır',
    paymentApproved: 'Ödəniş təsdiqlənib',
    paymentRejected: 'Ödəniş rədd edilib',
    certificatePreparing: 'Ödəniş təsdiqləndi. Sertifikatınız hazırlanır.',
    certificateIssued: 'Sertifikat təqdim edildi',
    certificateRevoked: 'Sertifikat ləğv edilib',
    certificateId: 'Sertifikat ID',
    issuedDate: 'Verilmə tarixi',
    viewCertificate: 'Sertifikata bax',
    downloadCertificate: 'Sertifikatı yüklə',
    verifyCertificate: 'Sertifikatı yoxla',
    notEligibleTitle: 'Sertifikat hələ əlçatan deyil',
    notEligibleDesc: 'Sertifikat əldə etmək üçün təcrübə proqramındakı bütün tələb olunan (required) tapşırıqları uğurla tamamlamalı və mentor tərəfindən təsdiq olunmalıdır.',
    paymentUnderReviewDesc: 'Ödəniş qəbziniz inzibatçı tərəfindən yoxlanılır. Təsdiqləndikdən sonra sertifikatınız tərtib olunacaq.',
    paymentApprovedDesc: 'Ödənişiniz uğurla təsdiq edildi. Rəsmi PDF sertifikatınız koordinator tərəfindən hazırlanır.',
    paymentRejectedDesc: 'Ödənişiniz təsdiqlənmədi. Zəhmət olmasa aşağıdakı qeydi oxuyun və yeni qəbz yükləyin.',
    publicVerifySuccess: 'Sertifikat rəsmi olaraq təsdiqlənmişdir',
    publicVerifyNotice: 'Bu sertifikat Talora platformasında təcrübə proqramını uğurla tamamlamış tələbəyə rəsmi olaraq verilmişdir.',
    publicVerifyNotFound: 'Daxil edilmiş identifikator üzrə aktiv və ya etibarlı sertifikat tapılmadı.',
    certificateSettings: 'Sertifikat Parametrləri',
    certificateOrders: 'Sertifikat Sifarişləri',
    certificatesRegistry: 'Verilmiş Sertifikatlar Reyestri',
    candidateAwaitingCert: 'Sertifikat tərtibatı gözləyən tələbələr',
    uploadPdfCertificate: 'Sertifikat PDF Yüklə',
    revokeCertificate: 'Sertifikatı ləğv et',
    revokeConfirm: 'Bu sertifikatı ləğv etmək istədiyinizə əminsiniz? Ləğv edildikdən sonra ictimai verifikasiyada etibarsız görünəcək.',

    // Student Settings (AZ)
    settingsTitle: 'Parametrlər',
    settingsSubtitle: 'Hesab və bildiriş tənzimləmələri',
    settingsSaved: 'Bildiriş parametrləri yadda saxlanıldı.',
    interfaceLanguage: 'İnterfeys Dili',
    interfaceLanguageDesc: 'Platformada istifadə etmək istədiyiniz dili seçin',
    languageAzLabel: 'Azərbaycan dili (AZ)',
    languageEnLabel: 'English (EN)',
    notificationSettings: 'Bildiriş Tənzimləmələri',
    notificationSettingsDesc: 'E-poçt bildirişləri üçün seçimlərinizi idarə edin',
    notifNewInternships: 'Yeni təcrübə elanları',
    notifNewInternshipsDesc: 'Yeni təcrübə proqramı açıldıqda e-poçt bildirişi almaq',
    notifApplicationStatus: 'Müraciət statusu dəyişiklikləri',
    notifApplicationStatusDesc: 'Müraciətinizin statusu dəyişdikdə e-poçt bildirişi almaq',
    saveBtn: 'Yadda saxla',
    settingsSaving: 'Saxlanılır...',
    settingsErrorViewAuth: 'Bildiriş parametrlərini görmək üçün hesabınıza daxil olun.',
    settingsErrorNoDb: 'Verilənlər bazası ilə əlaqə qurulmadı.',
    settingsErrorLoadFailed: 'Bildiriş parametrləri yüklənmədi.',
    settingsErrorSession: 'İstifadəçi sessiyası tapılmadı.',
    settingsErrorSaveAuth: 'Parametrləri saxlamaq üçün hesabınıza daxil olun.',
    settingsErrorSaveGeneric: 'Parametrlər saxlanarkən xəta baş verdi.',

    // Auth shared (AZ)
    authBackHome: 'Ana səhifə',
    authPortalSubtitle: 'Təcrübə Portalı',
    authStatPrograms: 'Proqram',
    authStatTasks: 'Tapşırıq',
    authStatWeeks: 'Həftə',
    authEmail: 'E-poçt ünvanı',
    authPassword: 'Şifrə',
    authPasswordMin: 'Şifrə (minimum 8 simvol)',
    authShowPassword: 'Şifrəni göstər',
    authHidePassword: 'Şifrəni gizlət',
    authFooter: 'Tələbələr üçün təcrübə portalı',
    authLoadingLogin: 'Giriş səhifəsi yüklənir...',
    authLangLabel: 'Dil',

    // Auth login (AZ)
    authLoginBadge: 'Tələbələr üçün',
    authLoginHeadline: 'Öyrəndiklərini portfelə çevir.',
    authLoginSubline: 'Hesabına daxil ol, real layihələri tap, mentor rəyini al və karyeranda görünən nəticələr qazan.',
    authLoginBullet1: 'Real şirkət layihələri üzərində iş',
    authLoginBullet2: 'Fərdi mentor dəstəyi və rəy',
    authLoginBullet3: 'Verifikasiya olunan sertifikat',
    authLoginTitle: 'Xoş gəldin geri.',
    authLoginSubtitle: 'Hesabına daxil ol, təcrübə müraciətlərinə və tapşırıqlarına bax.',
    authForgotPassword: 'Şifrəni unutdum?',
    authRememberMe: 'Məni xatırla',
    authSignIn: 'Daxil ol',
    authSigningIn: 'Daxil olunur...',
    authNoAccount: 'Hesabın yoxdur?',
    authFreeRegister: 'Pulsuz qeydiyyatdan keç',
    authNoticeAdmin: 'Bu sahifə yalnız administrator hesabı üçün əlçatandır. Tələbə hesabı ilə davam edin.',
    authNoticeSetup: 'Sistemin təhlükəsizlik parametrləri qurulmayıb. Giriş müvəqqəti olaraq əlçatan deyil.',
    authNoticeUnavailable: 'Giriş xidməti ilə əlaqə kurulmadı. Bir az sonra yenidən yoxlayın.',
    authNoticeRedirect: 'Davam etmək üçün hesabınıza daxil olun.',
    authErrorCredentials: 'E-poçt və ya şifrə yanlışdır. Əgər hesabınız yoxdursa, qeydiyyatdan keçin.',

    // Auth register (AZ)
    authRegisterBadge: 'Pulsuz qeydiyyat',
    authRegisterHeadline: 'İlk addımı bu gün at.',
    authRegisterSubline: 'Hesab yarat, universitetini göstər — biz sənə uyğun layihələri və mentor proqramlarını tövsiyə edək.',
    authRegisterBullet1: '60 saniyəyə profil yarat',
    authRegisterBullet2: 'Mentor tərəfindən şəxsi rəy',
    authRegisterBullet3: 'Bitirdikdə yoxlanıla bilən sertifikat',
    authRegisterFormBadge: 'Yeni hesab',
    authRegisterTitle: 'Profilini yarat.',
    authRegisterSubtitle: 'Bir neçə dəqiqəyə hazır ol — real layihələrə qoşulmağın başlanğıcı.',
    authFullName: 'Ad və soyad',
    authFullNamePlaceholder: 'məs. Leyla Məmmədova',
    authUniversity: 'Universitet',
    authUniversityPlaceholder: 'məs. universitetinizin tam adı',
    authTerms: 'İstifadə şərtləri',
    authPrivacy: 'Məxfilik siyasəti',
    authAgreeSuffix: 'ilə razıyam.',
    authRegisterSuccess: 'Qeydiyyat uğurla tamamlandı! Tələbə kabinetinə yönləndirilirsiniz...',
    authRegisterConfirmEmail: 'Hesabınızı aktivləşdirmək üçün e-poçtunuza göndərilən təsdiq linkini açın. Sonra daxil olun.',
    authErrorAgree: 'Qeydiyyatdan keçmək üçün şərtləri qəbul etməlisiniz.',
    authErrorRegister: 'Qeydiyyat zamanı xəta baş verdi. Yenidən cəhd edin.',
    authCreateAccount: 'Hesab yarat',
    authCreating: 'Hesab yaradılır...',
    authHaveAccount: 'Artıq hesabın var?',
    authQuote: 'Mentor mənə həftəlik fokus verdi — 8 həftə sonra ilk işimi tapdım.',
    authQuoteAuthor: 'Rauf A.',
    authQuoteMeta: 'Backend, 2025',

    // Student sidebar (AZ)
    sideStudentPortal: 'Tələbə Portalı',
    sideStudentFallback: 'Tələbə',
    sideStudentUniversityFallback: 'Universitet',
    sideStudentBadge: 'Tələbə',
    sideStudentMenu: 'Tələbə Menyu',
    sideStudentSignOut: 'Hesabdan çıx',
    sideDashboard: 'Dashboard',
    sideInternships: 'Təcrübələr',
    sideMyApplications: 'Müraciətlərim',
    sideMyInternship: 'Mənim təcrübəm',
    sideTasks: 'Tapşırıqlar',
    sideSubmissions: 'Təqdimatlar',
    sideCertificate: 'Sertifikat',
    sideNotifications: 'Bildirişlər',
    sideProfile: 'Profil',
    sideSettings: 'Parametrlər',

    // Admin sidebar (AZ)
    sideAdminPanel: 'İnzibatçı Paneli',
    sideAdminFallback: 'İnzibatçı',
    sideAdminBadge: 'Administrator',
    sideAdminMenu: 'İdarəetmə',
    sideAdminSignOut: 'Çıxış',
    sideAdminMobile: 'Talora İnzibatçı',
    sideAdminOverview: 'Ümumi baxış',
    sideAdminInternships: 'Təcrübə proqramları',
    sideAdminApplications: 'Müraciətlər',
    sideAdminStudents: 'Tələbələr',
    sideAdminCompleted: 'Tamamlanmış təcrübələr',
    sideAdminCertOrders: 'Sertifikat sifarişləri',
    sideAdminCertificates: 'Sertifikatlar',
    sideAdminCertSettings: 'Sertifikat parametrləri',
    sideAdminContact: 'Əlaqə mesajları',
  },
  en: {
    navHome: 'Home',
    navInternships: 'Internships',
    navHowItWorks: 'How it Works',
    navAbout: 'About Us',
    navContact: 'Contact',
    navLogin: 'Sign In',
    navRegister: 'Register',
    navDashboard: 'Dashboard',
    navLogout: 'Sign Out',

    footerDesc: 'An international platform connecting aspiring professionals with internship opportunities to gain practical experience, develop skills, and shape their careers.',
    footerPlatform: 'Platform',
    footerRights: 'All rights reserved.',
    footerBaku: 'Global Internship Network',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',

    emptyInternships: 'No active internship programs are available at the moment.',
    emptyApplications: 'You have no active applications at the moment.',
    emptyTasks: 'No assigned tasks currently pending.',
    emptySubmissions: 'No project submissions recorded yet.',
    emptyNotifications: 'No new notifications.',
    generalError: 'Something went wrong. Please try again.',
    retry: 'Please try again',

    internshipsTitle: 'Internship Programs',
    internshipsSubtitle: 'Explore industry-aligned internship openings curated for ambitious university students across Azerbaijan.',
    searchPlaceholder: 'Search by title, technology or skill...',
    allCategories: 'All Tracks',
    allDifficulties: 'All Difficulty Levels',
    filterResults: 'Filter Results',
    clearFilters: 'Clear Filters',
    durationWeeks: 'weeks',
    skills: 'Required Skills',
    requirements: 'Eligibility & Requirements',
    responsibilities: 'Key Responsibilities',
    benefits: 'Program Benefits',
    maxStudents: 'Cohort Capacity',
    placesAvailable: 'spots left',
    placesFull: 'This internship program is at full capacity',
    applicationDeadline: 'Application Deadline',
    startDate: 'Start Date',
    viewDetails: 'View Details',
    applyNow: 'Apply Now',
    loginToApply: 'Sign in to Apply',
    alreadyApplied: 'You have already applied to this program',
    alreadyParticipating: 'You are enrolled in this program',
    applicationsClosed: 'Applications are closed',
    deadlinePassed: 'Application deadline has passed',
    backToInternships: 'Back to all internships',
    difficultyBeginner: 'Beginner',
    difficultyIntermediate: 'Intermediate',
    difficultyAdvanced: 'Advanced',

    applyTitle: 'Apply for Internship',
    applySubtitle: 'Confirm your student profile and submit your motivation letter.',
    studentInfo: 'Student Information',
    motivationLabel: 'Statement of Motivation',
    motivationPlaceholder: 'Describe why you want to join this program, your career aspirations, and what you aim to achieve (minimum 50 characters)...',
    experienceLabel: 'Relevant Experience & Projects (Optional)',
    experiencePlaceholder: 'Briefly summarize relevant academic coursework, prior team projects, or extracurriculars...',
    portfolioLabel: 'Portfolio / Personal Website URL (Optional)',
    githubLabel: 'GitHub Profile (Optional)',
    linkedinLabel: 'LinkedIn Profile (Optional)',
    submitApplication: 'Submit Application',
    submitting: 'Submitting...',
    applicationSuccess: 'Your application has been submitted successfully!',
    applicationSuccessDesc: 'Your application will be carefully reviewed by the platform administrator. You can monitor its status from your dashboard.',
    emailSpamFolderNotice: 'If email notifications are enabled, messages from Talora will be delivered to your email inbox. If a message is not in your inbox, please check your Spam folder.',

    myApplicationsTitle: 'My Applications',
    myApplicationsSubtitle: 'Track your submitted internship applications and decisions.',
    noApplications: "You haven't applied to any internship programs yet.",
    statusPending: 'Pending',
    statusAccepted: 'Accepted',
    statusRejected: 'Rejected',
    statusWithdrawn: 'Withdrawn',
    withdrawApplication: 'Withdraw Application',
    withdrawConfirm: 'Are you sure you want to withdraw this application?',
    appliedOn: 'Applied on',
    lastUpdated: 'Last updated',
    adminNoteLabel: 'Admin Feedback / Note',

    activeInternshipTitle: 'My Internship',
    activeInternshipSubtitle: 'Your active internship enrollment, curriculum, and schedule.',
    noActiveInternship: 'You do not have an active internship program at the moment.',
    noActiveInternshipDesc: 'Once accepted into an internship program, your roadmap, syllabus, and assignments will appear here.',
    tasksPlaceholder: 'Your tasks will appear here.',
    programOverview: 'Program Overview',
    programDetails: 'Program Details',

    adminInternshipsTitle: 'Internship Programs Management',
    adminInternshipsSubtitle: 'Create, update, publish and manage corporate internship cohorts.',
    createNewInternship: 'Create New Internship',
    editInternship: 'Edit Internship',
    adminApplicationsTitle: 'Student Applications',
    adminApplicationsSubtitle: 'Review incoming applicant dossiers, accept qualified candidates or provide feedback.',
    reviewApplicationTitle: 'Application Review',
    accept: 'Accept Candidate',
    reject: 'Reject Application',
    acceptConfirm: 'Are you sure you want to accept this candidate into the program?',
    rejectConfirm: 'Are you sure you want to reject this application?',
    capacityReached: 'This internship program is at full capacity.',
    manageProgram: 'Manage this program',

    // Phase 4 Translations (EN)
    certificate: 'Certificate',
    certificateSubtitle: 'Official verified internship credential, payment status, and verification records.',
    certificatePayment: 'Certificate Payment',
    certificatePrice: 'Price',
    paymentCardNumber: 'Card for Payment',
    copyCardNumber: 'Copy Card Number',
    cardNumberCopied: 'Copied!',
    paymentM10Number: 'M10 payment number',
    copyM10Number: 'Copy M10 number',
    m10NumberCopied: 'M10 number copied!',
    uploadReceipt: 'Payment Receipt',
    uploadReceiptDesc: 'Upload your bank transfer receipt (JPG, PNG, WEBP or PDF).',
    submitPayment: 'Submit Receipt',
    paymentPending: 'Payment under review',
    paymentApproved: 'Payment approved',
    paymentRejected: 'Payment rejected',
    certificatePreparing: 'Payment approved. Your certificate is being prepared.',
    certificateIssued: 'Certificate issued',
    certificateRevoked: 'Certificate revoked',
    certificateId: 'Certificate ID',
    issuedDate: 'Issue Date',
    viewCertificate: 'View Certificate',
    downloadCertificate: 'Download Certificate',
    verifyCertificate: 'Verify Certificate',
    notEligibleTitle: 'Certificate is not available yet',
    notEligibleDesc: 'To earn an official certificate, you must successfully finish all required internship assignments and have them approved by mentors.',
    paymentUnderReviewDesc: 'Your payment receipt is being reviewed by the administration. Once verified, your certificate will be issued.',
    paymentApprovedDesc: 'Your payment was successfully confirmed. Your official certificate PDF is being prepared by our team.',
    paymentRejectedDesc: 'Your payment could not be verified. Please review the note below and submit a valid receipt.',
    publicVerifySuccess: 'Certificate Authenticated & Verified',
    publicVerifyNotice: 'This credential was officially issued by Talora to recognize successful completion of an industry internship program.',
    publicVerifyNotFound: 'No active or valid certificate was found matching this credential ID.',
    certificateSettings: 'Certificate Settings',
    certificateOrders: 'Certificate Orders',
    certificatesRegistry: 'Issued Certificates Registry',
    candidateAwaitingCert: 'Candidates Awaiting Certificate Issuance',
    uploadPdfCertificate: 'Upload Certificate PDF',
    revokeCertificate: 'Revoke Certificate',
    revokeConfirm: 'Are you sure you want to revoke this certificate? Once revoked, it will no longer verify on public verification pages.',

    // Student Settings (EN)
    settingsTitle: 'Settings',
    settingsSubtitle: 'Account and notification preferences',
    settingsSaved: 'Notification preferences saved.',
    interfaceLanguage: 'Interface Language',
    interfaceLanguageDesc: 'Choose the language you want to use on the platform',
    languageAzLabel: 'Azərbaycan dili (AZ)',
    languageEnLabel: 'English (EN)',
    notificationSettings: 'Notification Preferences',
    notificationSettingsDesc: 'Manage your email notification preferences',
    notifNewInternships: 'New internship postings',
    notifNewInternshipsDesc: 'Get an email when a new internship program opens',
    notifApplicationStatus: 'Application status changes',
    notifApplicationStatusDesc: 'Get an email when your application status changes',
    saveBtn: 'Save Changes',
    settingsSaving: 'Saving...',
    settingsErrorViewAuth: 'Sign in to your account to view your notification preferences.',
    settingsErrorNoDb: 'Could not connect to the database.',
    settingsErrorLoadFailed: 'Notification preferences could not be loaded.',
    settingsErrorSession: 'No user session was found.',
    settingsErrorSaveAuth: 'Sign in to your account to save these preferences.',
    settingsErrorSaveGeneric: 'An error occurred while saving your preferences.',

    // Auth shared (EN)
    authBackHome: 'Home',
    authPortalSubtitle: 'Internship Portal',
    authStatPrograms: 'Programs',
    authStatTasks: 'Tasks',
    authStatWeeks: 'Weeks',
    authEmail: 'Email address',
    authPassword: 'Password',
    authPasswordMin: 'Password (min. 8 characters)',
    authShowPassword: 'Show password',
    authHidePassword: 'Hide password',
    authFooter: 'Internship portal for students',
    authLoadingLogin: 'Loading sign-in page...',
    authLangLabel: 'Language',

    // Auth login (EN)
    authLoginBadge: 'For students',
    authLoginHeadline: 'Turn what you learn into a portfolio.',
    authLoginSubline: 'Sign in, find real projects, get mentor feedback and build results that stand out in your career.',
    authLoginBullet1: 'Work on real company projects',
    authLoginBullet2: 'Personal mentor support and feedback',
    authLoginBullet3: 'Verifiable certificate',
    authLoginTitle: 'Welcome back.',
    authLoginSubtitle: 'Sign in to track your internship applications and assignments.',
    authForgotPassword: 'Forgot password?',
    authRememberMe: 'Remember me',
    authSignIn: 'Sign In',
    authSigningIn: 'Signing in...',
    authNoAccount: "Don't have an account?",
    authFreeRegister: 'Register for free',
    authNoticeAdmin: 'This page is only available to administrator accounts. Continue with your student account.',
    authNoticeSetup: 'The system security settings are not configured. Sign-in is temporarily unavailable.',
    authNoticeUnavailable: 'Could not reach the sign-in service. Please try again shortly.',
    authNoticeRedirect: 'Sign in to your account to continue.',
    authErrorCredentials: 'Incorrect email or password. If you do not have an account, please register.',

    // Auth register (EN)
    authRegisterBadge: 'Free registration',
    authRegisterHeadline: 'Take the first step today.',
    authRegisterSubline: 'Create an account, add your university — we will recommend the projects and mentor programs that fit you.',
    authRegisterBullet1: 'Create your profile in 60 seconds',
    authRegisterBullet2: 'Personal feedback from mentors',
    authRegisterBullet3: 'Verifiable certificate on completion',
    authRegisterFormBadge: 'New account',
    authRegisterTitle: 'Create your profile.',
    authRegisterSubtitle: 'Be ready in minutes — the start of joining real projects.',
    authFullName: 'Full name',
    authFullNamePlaceholder: 'e.g. Leyla Mammadova',
    authUniversity: 'University',
    authUniversityPlaceholder: 'e.g. your university full name',
    authTerms: 'Terms of Service',
    authPrivacy: 'Privacy Policy',
    authAgreeSuffix: 'and I agree.',
    authRegisterSuccess: 'Registration completed successfully! Redirecting to your student dashboard...',
    authRegisterConfirmEmail: 'Open the confirmation link sent to your email to activate your account, then sign in.',
    authErrorAgree: 'You must accept the terms to register.',
    authErrorRegister: 'An error occurred during registration. Please try again.',
    authCreateAccount: 'Create Account',
    authCreating: 'Creating account...',
    authHaveAccount: 'Already have an account?',
    authQuote: 'My mentor gave me a weekly focus — eight weeks later I landed my first job.',
    authQuoteAuthor: 'Rauf A.',
    authQuoteMeta: 'Backend, 2025',

    // Student sidebar (EN)
    sideStudentPortal: 'Student Portal',
    sideStudentFallback: 'Student',
    sideStudentUniversityFallback: 'University',
    sideStudentBadge: 'Student',
    sideStudentMenu: 'Student Menu',
    sideStudentSignOut: 'Sign Out',
    sideDashboard: 'Dashboard',
    sideInternships: 'Internships',
    sideMyApplications: 'My Applications',
    sideMyInternship: 'My Internship',
    sideTasks: 'Assignments',
    sideSubmissions: 'Submissions',
    sideCertificate: 'Certificate',
    sideNotifications: 'Notifications',
    sideProfile: 'Profile',
    sideSettings: 'Settings',

    // Admin sidebar (EN)
    sideAdminPanel: 'Admin Panel',
    sideAdminFallback: 'Administrator',
    sideAdminBadge: 'Administrator',
    sideAdminMenu: 'Management',
    sideAdminSignOut: 'Sign Out',
    sideAdminMobile: 'Talora Admin',
    sideAdminOverview: 'Overview',
    sideAdminInternships: 'Internship Programs',
    sideAdminApplications: 'Applications',
    sideAdminStudents: 'Students',
    sideAdminCompleted: 'Completed Internships',
    sideAdminCertOrders: 'Certificate Orders',
    sideAdminCertificates: 'Certificates',
    sideAdminCertSettings: 'Certificate Settings',
    sideAdminContact: 'Contact Messages',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = (localStorage.getItem('talora_lang') || localStorage.getItem('intern_az_lang')) as Language;
        if (saved === 'az' || saved === 'en') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('talora_lang', lang);
        localStorage.setItem('intern_az_lang', lang);
      } catch {
        // ignore
      }
    }
  };

  const t = (key: keyof Translations): string => {
    return translations[language]?.[key] || translations.en?.[key] || translations.az[key] || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
