use wasm_bindgen::prelude::*;

const PCG_64BIT_MUL: u64 = 6364136223846793005;
// A default increment value, anything is fine, as long as it is odd.
const PCG_64BIT_INC: u64 = 1442695040888963407;

#[wasm_bindgen]
pub struct Rand {
    rnd: PcgXshRr,
}

#[wasm_bindgen]
impl Rand {
    pub fn new() -> Self {
        Rand {
            rnd: PcgXshRr::new2(&42, &54),
        }
    }

    pub fn next_int(&mut self) -> f64 {
        f64::from(self.rnd.next())
    }

    pub fn next_int_bounded(&mut self, bound: f64) -> f64 {
        // Any fractional parts are truncated.
        // NaN or <0 become 0.
        // Anything above 2^32 - 1 is clipped to that value
        let bound = bound as u32;
        f64::from(self.rnd.next_bounded(&bound))
    }
}

struct PcgXshRr {
    state: u64,
    inc: u64,
}

impl PcgXshRr {
    pub fn new(state: &u64) -> Self {
        PcgXshRr {
            state: PCG_64BIT_INC + state,
            inc: PCG_64BIT_INC,
        }
    }
    pub fn new2(state: &u64, inc: &u64) -> Self {
        // To be compatible with original source:
        // - initial inc value = param inc * 2 + 1,
        // - initial state value = initial inc + state
        // Reference:
        // https://github.com/imneme/pcg-c/blob/83252d9c23df9c82ecb42210afed61a7b42402d7/include/pcg_variants.h#L793
        let init_inc = inc << 1 | 1;
        let init_state = init_inc + state;
        PcgXshRr {
            state: init_state,
            inc: init_inc,
        }
    }

    pub fn next(&mut self) -> u32 {
        self.state = self
            .state
            .wrapping_mul(PCG_64BIT_MUL)
            .wrapping_add(self.inc);
        (((self.state ^ (self.state >> 18)) >> 27) as u32).rotate_right((self.state >> 59) as u32)
            as u32
    }

    pub fn next_bounded(&mut self, bound: &u32) -> u32 {
        // Avoid bias when bound is not a power of two. See:
        // https://github.com/imneme/pcg-c/blob/83252d9c23df9c82ecb42210afed61a7b42402d7/include/pcg_variants.h#L858
        // Though, if the bound is 1073741825 then it could be expensive
        loop {
            let val = self.next();
            let threshold = bound.wrapping_neg() % bound;
            if val >= threshold {
                return val % bound;
            }
            println!("Doh! val={val} threshold={threshold}")
        }
    }
}

#[cfg(test)]
mod tests {
    use core::f64;

    use super::*;

    #[test]
    fn pcg_xsh_rr() {
        let mut rng = PcgXshRr::new2(&42, &54);
        let expecteds: [u32; 6] = [
            2707161783, 2068313097, 3122475824, 2211639955, 3215226955, 3421331566,
        ];
        for i in 0..6 {
            let val = rng.next();
            assert_eq!(val, expecteds[i]);
        }
    }

    #[test]
    fn rand_next() {
        let mut rand = Rand::new();
        let expecteds: [f64; 6] = [
            2707161783.0,
            2068313097.0,
            3122475824.0,
            2211639955.0,
            3215226955.0,
            3421331566.0,
        ];
        for i in 0..6 {
            let val = rand.next_int();
            assert_eq!(val, expecteds[i]);
        }
    }

    #[test]
    fn rand_next_bounded() {
        let mut rand = Rand::new();
        // NOTE: I haven't verified this against the original for 1073741825 bound.
        let expecteds: [f64; 6] = [
            559678133.0,
            994571272.0,
            974992174.0,
            64156305.0,
            1067743305.0,
            200106091.0,
        ];
        for i in 0..6 {
            let val = rand.next_int_bounded(1073741825.0);
            assert_eq!(val, expecteds[i]);
        }
    }
}
