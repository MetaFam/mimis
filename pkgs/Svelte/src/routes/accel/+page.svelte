<script lang="ts">
  if(typeof Accelerometer !== 'undefined') {
    console.debug({ instantiating: Accelerometer })
    const acl = new Accelerometer({ frequency: 60 })
    console.debug({ instantiated: acl })
    acl.addEventListener("reading", () => {
      console.debug(`Acceleration: <, ${acl.x}, ${acl.y}, ${acl.z}>`)
    })

    acl.start()
  } else {
    console.warn('Accelerometer is not supported in this browser.')
  }
</script>

<h1>Accelerometer Test</h1>
