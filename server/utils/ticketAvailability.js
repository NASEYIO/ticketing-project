function calculateAvailability(tier) {
  const remaining = tier.capacity - tier.sold;
  return remaining < 0 ? 0 : remaining;
}

module.exports = { calculateAvailability };