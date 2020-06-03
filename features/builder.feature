Feature: Using the Story Builder

  Scenario Outline: Add many things
    Given I have a story builder
    And I have loaded the test data set
    And random returns <randomResult>
    When I create with "<test>"
    Then I get '<result>'

    Examples:
      | test                   | randomResult | result                |
      | {{ test }}             | 0            | potato                |
      | test                   | 0            | test                  |
      | a {{ test }} b         | 0            | a potato b            |
      | a {{ recurseTest }} b  | 0            | a potato b            |
      | a {{ recurseTest2 }} b | 0            | a potato potato b     |
      | {{ list }}             | 0            | a1                    |
      | {{ list }}             | 1            | a2                    |
      | {{ recurseList }}      | 0            | answer1               |
      | {{ recurseList }}      | 1            | answer2               |
      | {{ recurseList }}      | 2            | answer3               |
      | {{* test }}            | 0            | potatoes              |
      | {{^ test }}            | 1            | Potato                |
      | {{! test }}            | 1            | POTATO                |