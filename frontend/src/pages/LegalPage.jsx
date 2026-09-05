import { Link, useParams } from 'react-router-dom'

const Section = ({ title, children }) => (
  <section className="border-t pt-7" style={{ borderColor: '#DCE3EC' }}>
    <h2 className="text-lg font-bold" style={{ color: '#10243E' }}>{title}</h2>
    <div className="mt-3 space-y-3 leading-7 text-slate-600">{children}</div>
  </section>
)

export default function LegalPage() {
  const { page } = useParams()
  const cgu = page === 'cgu'
  const suppression = page === 'suppression-compte'
  const title = cgu ? "Conditions generales d'utilisation"
    : suppression ? 'Suppression de compte'
    : 'Politique de confidentialite'

  return (
    <main className="min-h-dvh px-5 py-8 sm:py-14" style={{ background: '#F5F6F8' }}>
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#DCE3EC' }}>
        <header className="px-6 py-8 sm:px-10" style={{ background: 'linear-gradient(135deg, #10243E, #3768AF)' }}>
          <Link to="/" className="text-sm font-semibold text-white/80 hover:text-white">← Retour a PayTrack</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-emerald-300">ATAABA GROUP · PayTrack</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-blue-100">Derniere mise a jour : 4 septembre 2026</p>
        </header>
        <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
          {cgu ? <>
            <Section title="Objet et acces au service"><p>PayTrack est une solution de gestion commerciale proposee par ATAABA GROUP. L'utilisation du service suppose l'acceptation des presentes conditions.</p></Section>
            <Section title="Compte et responsabilites"><p>Vous fournissez des informations exactes, protegez vos identifiants et etes responsable des operations realisees depuis votre compte. Nous pouvons suspendre un compte en cas d'usage frauduleux ou contraire a la loi.</p></Section>
            <Section title="Abonnement et paiements"><p>L'abonnement PayTrack couvre l'acces a la plateforme. Les frais de transaction DexPay sont distincts, supportes par le marchand et affiches avant la confirmation d'un encaissement ou d'un retrait. Le client final paie uniquement le montant de son achat.</p><p>Les montants et disponibilites des paiements sont confirmes par DexPay et les operateurs concernes.</p></Section>
            <Section title="Donnees et assistance"><p>Le traitement de vos donnees est decrit dans notre politique de confidentialite. Pour toute question : <a className="font-semibold underline" href="mailto:support@paytrack.sn">support@paytrack.sn</a>.</p></Section>
          </> : suppression ? <>
            <Section title="Comment demander la suppression">
              <p>Conformement au RGPD et aux regles de Google Play, vous avez le droit de demander la suppression de votre compte PayTrack et de toutes les donnees associees.</p>
              <p>Pour demander la suppression de votre compte, envoyez un email a :</p>
              <div className="rounded-xl px-5 py-4 my-2" style={{ background: '#EBF5FF', border: '1px solid #BFDBFE' }}>
                <a href="mailto:privacy@paytrack.sn?subject=Demande de suppression de compte" className="font-bold underline" style={{ color: '#1E40AF' }}>privacy@paytrack.sn</a>
              </div>
              <p>Veuillez inclure dans votre demande :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>L'adresse email associee a votre compte PayTrack</li>
                <li>Votre nom complet</li>
                <li>La raison de votre demande (optionnel)</li>
              </ul>
            </Section>
            <Section title="Donnees supprimees">
              <p>Lors de la suppression de votre compte, les donnees suivantes seront definitivement effacees :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Informations de profil (nom, email, telephone)</li>
                <li>Historique des ventes et paiements</li>
                <li>Documents KYC uploades</li>
                <li>Donnees de wallet et transactions</li>
              </ul>
            </Section>
            <Section title="Delai de traitement">
              <p>Votre demande sera traitee dans un delai maximum de <strong>30 jours</strong>. Vous recevrez une confirmation par email une fois la suppression effectuee.</p>
            </Section>
            <Section title="Donnees conservees pour obligations legales">
              <p>Certaines donnees peuvent etre conservees pour des obligations legales (facturation, comptabilite) pendant une duree maximale de 10 ans, conformement a la legislation senegalaise.</p>
            </Section>
          </> : <>
            <Section title="Responsable du traitement"><p>ATAABA GROUP, Dakar, Senegal, est responsable des donnees traitees par PayTrack. Contact confidentialite : <a className="font-semibold underline" href="mailto:privacy@paytrack.sn">privacy@paytrack.sn</a>.</p></Section>
            <Section title="Donnees que nous utilisons"><p>Nous utilisons les informations de compte et de contact, les donnees de ventes, clients, commandes et paiements, ainsi que les informations techniques necessaires a la securite et au fonctionnement du service.</p></Section>
            <Section title="Pourquoi et avec qui"><p>Ces donnees servent a fournir PayTrack, securiser les comptes, executer les paiements demandes et envoyer des notifications de service. Elles peuvent etre traitees par nos prestataires d'hebergement et de paiement, uniquement pour ces finalites.</p></Section>
            <Section title="Conservation et vos droits"><p>Les donnees sont conservees pendant la relation contractuelle, puis selon les obligations legales applicables. Vous pouvez demander l'acces, la rectification, l'effacement ou vous opposer a certains traitements en ecrivant a privacy@paytrack.sn.</p></Section>
            <Section title="Securite"><p>Les echanges avec PayTrack sont chiffres. Nous mettons en oeuvre des mesures techniques et organisationnelles adaptees ; aucun systeme ne peut toutefois garantir une securite absolue.</p></Section>
          </>}
          <footer className="rounded-xl px-5 py-4 text-sm" style={{ background: '#EAF7EE', color: '#267B3D' }}>Pour contacter PayTrack : <a className="font-bold underline" href="mailto:contact@paytrack.sn">contact@paytrack.sn</a></footer>
        </div>
      </article>
    </main>
  )
}
