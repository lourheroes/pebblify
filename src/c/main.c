#include <pebble.h>
#include <pebblejs/simply.h>

int main(void) {
  Simply *simply = simply_create();
  app_event_loop();
  simply_destroy(simply);
}
