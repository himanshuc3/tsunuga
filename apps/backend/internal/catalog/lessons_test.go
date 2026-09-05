package catalog

import "testing"

func TestIDsAreUnique(t *testing.T) {
	lessons := make(map[string]struct{})
	items := make(map[string]struct{})

	for _, lesson := range Lessons {
		if _, ok := lessons[lesson.ID]; ok {
			t.Fatalf("duplicate lesson id %q", lesson.ID)
		}
		lessons[lesson.ID] = struct{}{}

		for _, concept := range lesson.Concepts {
			if _, ok := items[concept.ID]; ok {
				t.Fatalf("duplicate item id %q", concept.ID)
			}
			items[concept.ID] = struct{}{}
		}
		for _, vocab := range lesson.Vocab {
			if _, ok := items[vocab.ID]; ok {
				t.Fatalf("duplicate item id %q", vocab.ID)
			}
			items[vocab.ID] = struct{}{}
		}
	}
}

func TestNext(t *testing.T) {
	next, ok := Next("lesson-01-people")
	if !ok || next.ID != "lesson-02-greetings" {
		t.Fatalf("got %+v ok=%v", next, ok)
	}
	if _, ok := Next("lesson-04-particles"); ok {
		t.Fatal("expected no lesson after the last one")
	}
}
