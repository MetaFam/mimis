<script lang="ts">
  import { browser } from "$app/environment"
  let {
    min = 0, max = 100, step = 1, property,
    prefix = '', suffix = '', label = null,
  } = $props()
  let value = $state(
    browser ? (
      document.documentElement.style.getPropertyValue(property) ?? 0
    ) : 0
  )

  function oninput(
    evt: Event & {
      currentTarget: EventTarget & HTMLInputElement
    }
  ) {
    document.documentElement.style.setProperty(
      property, `${prefix}${value}${suffix}`
    )
  }
</script>

<form>
  <label>
    {#if label}
      <span>{label}</span>
    {/if}
    <input type="range" bind:value {min} {max} {step} {oninput}/>
  </label>
</form>