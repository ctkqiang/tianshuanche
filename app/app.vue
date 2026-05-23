<script setup>
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Nuxt Starter Template'
const description = `A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <UMain>
      <NuxtPage />
    </UMain>

    <!--  Commented Temporary for now  -->
    <!-- <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          哪吒网络安全-钟智强 • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          to=""
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter> -->
  </UApp>
</template>
