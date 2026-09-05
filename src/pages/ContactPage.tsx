const contact = {
  email: 'hello@example.com',
  etsy: 'https://www.etsy.com/shop/your-shop',
  social: [
    { label: 'Instagram', url: 'https://instagram.com/your-handle' },
    { label: 'Facebook', url: 'https://facebook.com/your-page' },
  ],
}

export default function ContactPage() {
  return (
    <section className="contact">
      <h1>Contact</h1>
      <p>
        Have a question about a piece, a custom commission, or just want to say
        hello? Reach out any time.
      </p>
      <ul className="contact-list">
        <li>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          <a href={contact.etsy} target="_blank" rel="noreferrer">
            Etsy shop
          </a>
        </li>
        {contact.social.map(({ label, url }) => (
          <li key={label}>
            <a href={url} target="_blank" rel="noreferrer">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}