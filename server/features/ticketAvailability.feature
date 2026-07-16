Feature: Ticket Availability
  As a buyer browsing an event
  I want to see how many tickets remain for each ticket tier
  So that I know whether tickets are still available before trying to buy

  Scenario: Viewing availability for a tier with some tickets sold
    Given an event exists with a ticket tier that has capacity 100 and 30 sold
    When I request the availability for that event
    Then the response should show 70 tickets remaining for that tier

  Scenario: Viewing availability for a completely sold out tier
    Given an event exists with a ticket tier that has capacity 50 and 50 sold
    When I request the availability for that event
    Then the response should show 0 tickets remaining for that tier

  Scenario: Requesting availability for an event that does not exist
    Given no event exists with a given id
    When I request the availability for that event
    Then the response should indicate the event was not found