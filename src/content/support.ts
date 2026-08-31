import { githubUrl, siteUrl } from '@/lib/site';

/**
 * The post X opens prefilled. Blank lines separate paragraphs, and the site URL
 * is filled in at build time, so leave `${siteUrl}` in place.
 */
const sharePost = `GitHub's default card looks the same for every project. No wonder nobody shares them anymore.

Repo Frame by @orbitslab gives you a whole shelf of styles instead, and this one is actually worth posting.

Try it yourself: ${siteUrl}`;

/**
 * Every string the landing page's support section prints. Edit the text here
 * rather than in the page; `platform` picks which logo the card is watermarked
 * with and is the one field that is not free text.
 */
const supportContent = {
  eyebrow: 'Help it spread',
  heading: 'Like our product? Help it reach more developers.',
  cards: [
    {
      platform: 'github',
      action: 'Star it on GitHub',
      detail:
        'A star is how other developers find the project at all. It costs one click.',
      cta: 'Open the repository',
      href: githubUrl,
    },
    {
      platform: 'x',
      action: 'Post your card on X',
      detail:
        'Show the card you made and mention @orbitslab, so we see it and can share it on.',
      cta: 'Write the post',
      href: `https://x.com/intent/post?text=${encodeURIComponent(sharePost)}`,
    },
  ],
} as const;

export { supportContent };
